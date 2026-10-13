import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createApp } from "../../src/app.js";
import { User } from "../../src/models/User.js";
import { TestClient } from "../helpers/testClient.js";
import { getTestAppConfig } from "../helpers/testConfig.js";
import {
  connectTestDatabase,
  clearDatabase,
  disconnectTestDatabase,
} from "../helpers/testDb.js";
import { createSyntheticPdfBytes } from "../helpers/documentFixtures.js";

const config = getTestAppConfig();
const app = createApp(config);
const client = new TestClient(app);

before(async () => {
  await connectTestDatabase();
  await client.start();
});

beforeEach(async () => {
  await clearDatabase();
  client.cookies.clear();
  client.csrfToken = null;
});

after(async () => {
  await client.stop();
  await disconnectTestDatabase();
  await fs.rm(config.uploadDir, { recursive: true, force: true });
});

test("creates anonymous session without login UI credentials", async () => {
  const { response, body } = await client.request(
    "/api/v1/auth/anonymous-session",
    { method: "POST" }
  );

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data.accessToken);
  assert.equal(body.data.isAnonymous, true);
  assert.equal(body.data.user.isAnonymous, true);

  const user = await User.findById(body.data.user.id);
  assert.ok(user?.isAnonymous);
});

test("anonymous token can upload and read owned document status", async () => {
  const session = await client.request("/api/v1/auth/anonymous-session", {
    method: "POST",
  });
  const token = session.body.data.accessToken;

  const form = new FormData();
  form.append(
    "file",
    new Blob([await createSyntheticPdfBytes("Rest and fluids.")], {
      type: "application/pdf",
    }),
    "guest-summary.pdf"
  );

  const uploadResponse = await fetch(
    `http://127.0.0.1:${client.port}/api/v1/documents`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  const uploadBody = await uploadResponse.json();
  assert.equal(uploadResponse.status, 201);
  assert.ok(uploadBody.data.id);

  const status = await client.request(
    `/api/v1/documents/${uploadBody.data.id}/status`,
    { authToken: token }
  );

  assert.equal(status.response.status, 200);
  assert.ok(["ready", "review_required", "failed"].includes(status.body.data.status));
});

test("document id alone cannot access another user's document", async () => {
  const sessionA = await client.request("/api/v1/auth/anonymous-session", {
    method: "POST",
  });
  const sessionB = await client.request("/api/v1/auth/anonymous-session", {
    method: "POST",
  });

  const form = new FormData();
  form.append(
    "file",
    new Blob([await createSyntheticPdfBytes("Private doc.")], {
      type: "application/pdf",
    }),
    "private.pdf"
  );

  const uploadResponse = await fetch(
    `http://127.0.0.1:${client.port}/api/v1/documents`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionA.body.data.accessToken}` },
      body: form,
    }
  );
  const uploadBody = await uploadResponse.json();

  const foreign = await client.request(
    `/api/v1/documents/${uploadBody.data.id}/status`,
    { authToken: sessionB.body.data.accessToken }
  );

  assert.equal(foreign.response.status, 404);
});
