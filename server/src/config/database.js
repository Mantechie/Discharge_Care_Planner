import mongoose from "mongoose";

export async function connectDatabase(mongodbUri) {
  mongoose.set("strictQuery", true);

  await mongoose.connect(mongodbUri);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export function getDatabaseConnectionState() {
  return mongoose.connection.readyState;
}
