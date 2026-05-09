const mongoose = require("mongoose");
const dns = require("dns");

function isSrvDnsRefusal(error) {
  return (
    error?.code === "ECONNREFUSED" &&
    error?.syscall === "querySrv"
  );
}

async function connectWithDnsFallback(uri) {
  try {
    await mongoose.connect(uri);
  } catch (error) {
    if (!uri.startsWith("mongodb+srv://") || !isSrvDnsRefusal(error)) {
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
  console.log("MongoDB connected");
}

module.exports = connectDb;
