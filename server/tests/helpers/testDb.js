import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../src/config/database.js";

let memoryServer;

export function getTestMongoUri() {
  return (
    process.env.TEST_MONGODB_URI ||
    "mongodb://127.0.0.1:27017/dischargecare_test"
  );
}

export async function connectTestDatabase() {
  if (process.env.TEST_MONGODB_URI) {
    await connectDatabase(process.env.TEST_MONGODB_URI);
    return;
  }

  memoryServer = await MongoMemoryServer.create();
  await connectDatabase(memoryServer.getUri());
}

export async function clearDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

export async function disconnectTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }

  await disconnectDatabase();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
