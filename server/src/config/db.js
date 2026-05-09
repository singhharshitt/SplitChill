const mongoose = require("mongoose");
const dns = require("dns");

function isSrvDnsRefusal(error) {
  return (
    error?.code === "ECONNREFUSED" &&
    error?.syscall === "querySrv"
  );
}

function isServerSelectionFailure(error) {
  return error?.name === "MongooseServerSelectionError" ||
    error?.reason?.type === "ReplicaSetNoPrimary" ||
    error?.message?.includes("Could not connect to any servers");
}

function shouldUseDevFallback(uri, error) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.MONGO_DEV_FALLBACK === "false") return false;
  if (!uri.startsWith("mongodb+srv://") && !uri.includes("mongodb.net")) return false;
  return isServerSelectionFailure(error);
}

function isLocalMongoRefused(uri, error) {
  return uri.includes("127.0.0.1") &&
    uri.includes("27017") &&
    (error?.message?.includes("ECONNREFUSED") || error?.reason?.type === "Unknown");
}

function buildLocalMongoMessage(uri) {
  return [
    `Local MongoDB is not reachable at ${uri}.`,
    "Start MongoDB before using the API:",
    "  docker compose up -d mongo",
    "or install/start MongoDB locally on port 27017.",
    "If you want Atlas in development, whitelist your current IP in MongoDB Atlas and set MONGO_DEV_FALLBACK=false.",
  ].join("\n");
}

async function connectWithDnsFallback(uri) {
  try {
    await mongoose.connect(uri);
  } catch (error) {
    if (shouldUseDevFallback(uri, error)) {
      const fallbackUri = process.env.MONGO_FALLBACK_URI || "mongodb://127.0.0.1:27017/splitchill";
      console.warn(
        "MongoDB Atlas connection failed in development. Falling back to local MongoDB. " +
        "For production, whitelist the server IP in Atlas and set NODE_ENV=production."
      );
      await mongoose.disconnect().catch(() => {});
      try {
        await mongoose.connect(fallbackUri);
      } catch (fallbackError) {
        if (isLocalMongoRefused(fallbackUri, fallbackError)) {
          fallbackError.message = `${fallbackError.message}\n\n${buildLocalMongoMessage(fallbackUri)}`;
        }
        throw fallbackError;
      }
      return;
    }

    if (!uri.startsWith("mongodb+srv://") || !isSrvDnsRefusal(error)) {
      if (isLocalMongoRefused(uri, error)) {
        error.message = `${error.message}\n\n${buildLocalMongoMessage(uri)}`;
      }
      throw error;
    }

    const dnsServers = (process.env.MONGO_DNS_SERVERS || "1.1.1.1,8.8.8.8")
      .split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    if (!dnsServers.length) {
      throw error;
    }

    console.warn(
      `MongoDB SRV lookup was refused by the current DNS resolver. Retrying with DNS servers: ${dnsServers.join(", ")}`
    );

    dns.setServers(dnsServers);
    await mongoose.connect(uri);
  }
}

async function connectDb() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;

  if (!uri) {
    throw new Error("Missing MONGO_URI, MONGODB_URI, or DB_URI environment variable");
  }

  mongoose.set("strictQuery", true);
  await connectWithDnsFallback(uri);
  console.log(`MongoDB connected (${mongoose.connection.host || "cluster"})`);
}

module.exports = connectDb;
