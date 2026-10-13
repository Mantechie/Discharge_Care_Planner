import { test, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../../src/app.js";

const testConfig = {
  clientUrl: "http://localhost:5173",
  apiPrefix: "/api/v1",
  jsonBodyLimit: "1mb",
};

const app = createApp(testConfig);
const server = http.createServer(app);

await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", resolve);
});

const { port } = server.address();

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

async function request(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  const body = await response.json();
  return { response, body };
}

test("GET /api/v1/health returns healthy status", async () => {
  const { response, body } = await request("/api/v1/health");

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "healthy");
  assert.equal(body.data.service, "dischargecare-api");
  assert.equal(body.data.mongodb, undefined);
});

test("GET /api/health supports the legacy React client path", async () => {
  const { response, body } = await request("/api/health");

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "Backend connected");
});

test("unknown routes return the standard error format", async () => {
  const { response, body } = await request("/api/v1/unknown-route");

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.error.code, "NOT_FOUND");
  assert.ok(typeof body.requestId === "string" && body.requestId.length > 0);
});
