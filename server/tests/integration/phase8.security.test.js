import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../../src/app.js";
import { Document } from "../../src/models/Document.js";
import { CarePlan } from "../../src/models/CarePlan.js";
import { TestClient } from "../helpers/testClient.js";
import { getTestAppConfig } from "../helpers/testConfig.js";
import {
  connectTestDatabase,
  clearDatabase,
  disconnectTestDatabase,
} from "../helpers/testDb.js";

const config = getTestAppConfig();
const app = createApp(config);
const client = new TestClient(app);
let tokenA;
let tokenB;
let documentBId;

before(async () => {
  await connectTestDatabase();
  await client.start();
});

beforeEach(async () => {
  await clearDatabase();
  client.cookies.clear();
  client.csrfToken = null;

  const userA = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "User A",
      email: "phase8-a@example.com",
      password: "a-strong-demo-password",
    },
  });
  tokenA = userA.body.data.accessToken;

  const userB = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "User B",
      email: "phase8-b@example.com",
      password: "a-strong-demo-password",
    },
  });
  tokenB = userB.body.data.accessToken;

  const docB = await Document.create({
    userId: userB.body.data.user.id,
    originalFilename: "private.pdf",
    mimeType: "application/pdf",
    fileSize: 100,
    storageKey: "storage/b/private.pdf",
  });
  documentBId = docB._id.toString();

  await CarePlan.create({
    userId: userB.body.data.user.id,
    documentId: docB._id,
    medications: [{ name: "Private Med" }],
  });
});

after(async () => {
  await client.stop();
  await disconnectTestDatabase();
});

test("malformed document id returns not found without leaking ownership", async () => {
  const { response, body } = await client.request(
    "/api/v1/documents/not-a-valid-id",
    { authToken: tokenA }
  );

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
  assert.equal(body.error.message.includes("User B"), false);
});

test("user A cannot patch user B reminder settings", async () => {
  const { response } = await client.request("/api/v1/reminders/settings", {
    method: "PATCH",
    authToken: tokenA,
    body: { enabled: false },
  });

  assert.equal(response.status, 200);

  const settingB = await client.request("/api/v1/reminders/settings", {
    authToken: tokenB,
  });

  assert.equal(settingB.body.data.enabled, true);
});

test("user A cannot delete user B chat history", async () => {
  const del = await client.request(
    `/api/v1/chat/history?documentId=${documentBId}`,
    { method: "DELETE", authToken: tokenA }
  );

  assert.equal(del.response.status, 404);
});

test("production error responses omit stack traces", async () => {
  const prodApp = createApp({
    ...config,
    isProduction: true,
    nodeEnv: "production",
  });
  const server = http.createServer(prodApp);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/v1/unknown-route`);
  const body = await response.json();

  assert.equal(body.success, false);
  assert.equal(body.stack, undefined);
  assert.equal(body.error?.stack, undefined);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
