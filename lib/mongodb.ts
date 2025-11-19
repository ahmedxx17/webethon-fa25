import mongoose from "mongoose";
import { seedDatabase } from "./seed";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache || { conn: null, promise: null };

export async function initDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  global.mongooseCache = cached;

  await seedDatabase();

  return cached.conn;
}

