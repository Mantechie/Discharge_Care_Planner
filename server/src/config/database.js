import mongoose from "mongoose";

function enrichConnectionError(error) {
  const message = error?.message || "";

  if (/bad auth|authentication failed/i.test(message)) {
    const hint =
      "MongoDB rejected the username or password in MONGODB_URI. " +
      "In Atlas: Database Access → reset the user password, update server/.env, " +
      "and URL-encode special characters in the password (@, :, /, ?, #, etc.).";
    const wrapped = new Error(`${message} — ${hint}`);
    wrapped.cause = error;
    return wrapped;
  }

  return error;
}

export async function connectDatabase(mongodbUri) {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    throw enrichConnectionError(error);
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export function getDatabaseConnectionState() {
  return mongoose.connection.readyState;
}
