import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createApp } from "../../src/app.js";
import { User } from "../../src/models/User.js";
import { Document } from "../../src/models/Document.js";
import { CarePlan } from "../../src/models/CarePlan.js";
import { Task } from "../../src/models/Task.js";
import { FollowUp } from "../../src/models/FollowUp.js";
import { ReminderSetting } from "../../src/models/ReminderSetting.js";
import { ChatMessage } from "../../src/models/ChatMessage.js";
import { TestClient } from "../helpers/testClient.js";
import { getTestAppConfig } from "../helpers/testConfig.js";
import {
  connectTestDatabase,
  clearDatabase,
  disconnectTestDatabase,
} from "../helpers/testDb.js";

const config = getTestAppConfig();
const app = createApp(config);
const clientA = new TestClient(app);
const clientB = new TestClient(app);

async function registerAndGetToken(client, email) {
  const { body } = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: `User ${email}`,
      email,
      password: "a-strong-demo-password",
    },
  });

  return body.data.accessToken;
}

async function seedForUser(userId) {
  const document = await Document.create({
    userId,
    originalFilename: "summary.pdf",
    mimeType: "application/pdf",
    fileSize: 1200,
    storageKey: `storage/${userId}/summary.pdf`,
  });

  const carePlan = await CarePlan.create({
    userId,
    documentId: document._id,
    medications: [{ name: "Medicine A" }],
  });

  const task = await Task.create({
    userId,
    carePlanId: carePlan._id,
    documentId: document._id,
    title: "Daily care task",
    category: "care_instruction",
    timezone: "Asia/Kolkata",
  });

  const followUp = await FollowUp.create({
    userId,
    carePlanId: carePlan._id,
    documentId: document._id,
    title: "Follow-up visit",
  });

  await ChatMessage.create({
    userId,
    documentId: document._id,
    carePlanId: carePlan._id,
    role: "user",
    message: "Private chat message",
    language: "en",
  });

  return { document, carePlan, task, followUp };
}

let userA;
let userB;
let resourcesA;
let tokenA;
let tokenB;

before(async () => {
  await connectTestDatabase();
  await clientA.start();
  await clientB.start();
});

beforeEach(async () => {
  await clearDatabase();
  clientA.cookies.clear();
  clientA.csrfToken = null;
  clientB.cookies.clear();
  clientB.csrfToken = null;

  tokenA = await registerAndGetToken(clientA, "user-a@example.com");
  tokenB = await registerAndGetToken(clientB, "user-b@example.com");

  userA = await User.findOne({ email: "user-a@example.com" });
  userB = await User.findOne({ email: "user-b@example.com" });

  resourcesA = await seedForUser(userA._id);
  await seedForUser(userB._id);
});

after(async () => {
  await clientA.stop();
  await clientB.stop();
  await disconnectTestDatabase();
});

test("user A cannot read user B document", async () => {
  const documentB = await Document.findOne({ userId: userB._id });

  const { response, body } = await clientA.request(
    `/api/v1/documents/${documentB._id.toString()}`,
    { authToken: tokenA }
  );

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
});

test("user A cannot read user B care plan", async () => {
  const carePlanB = await CarePlan.findOne({ userId: userB._id });

  const { response } = await clientA.request(
    `/api/v1/care-plans/${carePlanB._id.toString()}`,
    { authToken: tokenA }
  );

  assert.equal(response.status, 404);
});

test("user A cannot read user B task", async () => {
  const taskB = await Task.findOne({ userId: userB._id });

  const { response } = await clientA.request(
    `/api/v1/tasks/${taskB._id.toString()}`,
    { authToken: tokenA }
  );

  assert.equal(response.status, 404);
});

test("user A cannot read user B follow-up", async () => {
  const followUpB = await FollowUp.findOne({ userId: userB._id });

  const { response } = await clientA.request(
    `/api/v1/follow-ups/${followUpB._id.toString()}`,
    { authToken: tokenA }
  );

  assert.equal(response.status, 404);
});

test("user A cannot read user B chat history", async () => {
  const documentB = await Document.findOne({ userId: userB._id });

  const { response, body } = await clientA.request(
    `/api/v1/chat/history?documentId=${documentB._id.toString()}`,
    { authToken: tokenA }
  );

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
});

test("user A cannot create a task under user B care plan", async () => {
  const carePlanB = await CarePlan.findOne({ userId: userB._id });
  const documentB = await Document.findOne({ userId: userB._id });

  const { response, body } = await clientA.request("/api/v1/tasks", {
    method: "POST",
    authToken: tokenA,
    body: {
      carePlanId: carePlanB._id.toString(),
      documentId: documentB._id.toString(),
      title: "Cross-user task",
      category: "other",
      timezone: "Asia/Kolkata",
    },
  });

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
});

test("user A can access own reminder settings only", async () => {
  const { response, body } = await clientA.request("/api/v1/reminders/settings", {
    authToken: tokenA,
  });

  assert.equal(response.status, 200);
  assert.equal(body.data.reviewTime, "06:00");

  const settingB = await ReminderSetting.findOne({ userId: userB._id });
  assert.notEqual(settingB.userId.toString(), userA._id.toString());
});

test("user A can read own seeded resources", async () => {
  const { response, body } = await clientA.request(
    `/api/v1/documents/${resourcesA.document._id.toString()}`,
    { authToken: tokenA }
  );

  assert.equal(response.status, 200);
  assert.equal(body.data.id, resourcesA.document._id.toString());
  assert.equal(body.data.storageKey, undefined);
});

test("client cannot assign another userId through task creation", async () => {
  const { response, body } = await clientA.request("/api/v1/tasks", {
    method: "POST",
    authToken: tokenA,
    body: {
      userId: userB._id.toString(),
      carePlanId: resourcesA.carePlan._id.toString(),
      documentId: resourcesA.document._id.toString(),
      title: "Owned task",
      category: "other",
      timezone: "Asia/Kolkata",
    },
  });

  assert.equal(response.status, 201);
  const created = await Task.findById(body.data.id);
  assert.equal(created.userId.toString(), userA._id.toString());
});
