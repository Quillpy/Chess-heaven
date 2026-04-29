import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

const client = new MongoClient(env.MONGODB_URI, {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

export const mongoClientPromise = (global.__mongoClientPromise__ ?? client.connect())
  .catch(err => {
    console.error("Failed to connect to MongoDB:", err.message);
    throw err;
  });

if (process.env.NODE_ENV !== "production") {
  global.__mongoClientPromise__ = mongoClientPromise;
}

export async function getDb() {
  const connection = await mongoClientPromise;
  return connection.db("chess-heaven");
}
