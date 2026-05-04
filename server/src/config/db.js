const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGO_URI || process.env.DB_URI;

  if (!uri) {
    throw new Error("Missing MONGO_URI or DB_URI environment variable");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = connectDb;
