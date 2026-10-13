import http from "node:http";
import { loadEnv } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { createApp } from "./app.js";

let server;
let isShuttingDown = false;

async function start() {
  const config = loadEnv();

  await connectDatabase(config.mongodbUri);

  const app = createApp(config);
  server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(config.port, resolve);
  });

  console.log(
    `DischargeCare API listening on http://localhost:${config.port}${config.apiPrefix}`
  );
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  await disconnectDatabase();
  console.log("Shutdown complete.");
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT").catch((error) => {
    console.error("Shutdown failed:", error.message);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((error) => {
    console.error("Shutdown failed:", error.message);
    process.exit(1);
  });
});

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
