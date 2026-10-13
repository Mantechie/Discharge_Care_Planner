import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { CarePlan } from "../../src/models/CarePlan.js";
import { Document } from "../../src/models/Document.js";
import { Task } from "../../src/models/Task.js";
import { FollowUp } from "../../src/models/FollowUp.js";
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
let token;
let userId;
let document;
let carePlan;

before(async () => {
  await connectTestDatabase();
  await client.start();
});

beforeEach(async () => {
  await clearDatabase();
  client.cookies.clear();
  client.csrfToken = null;

  const register = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Phase5 User",
      email: "phase5@example.com",
      password: "a-strong-demo-password",
    },
  });

  token = register.body.data.accessToken;
  userId = register.body.data.user.id;

  document = await Document.create({
    userId,
    originalFilename: "summary.pdf",
    mimeType: "application/pdf",
    fileSize: 1000,
    storageKey: `storage/${userId}/summary.pdf`,
  });

  carePlan = await CarePlan.create({
    userId,
    documentId: document._id,
    status: "review_required",
    summary: "Extracted summary text",
    medications: [
      {
        name: "Paracetamol",
        dose: "500mg",
        frequency: "twice daily",
      },
    ],
    clarifications: [
      {
        field: "medications[0].dose",
        question: "Confirm dose",
        reason: "Dose unclear",
        requiresProfessionalConfirmation: true,
        reviewPriority: "high",
        status: "open",
      },
    ],
    extractedSnapshot: {
      summary: "Extracted summary text",
      medications: [{ name: "Paracetamol", dose: "500mg", frequency: "twice daily" }],
    },
    isActive: true,
  });
});

after(async () => {
  await client.stop();
  await disconnectTestDatabase();
});

test("lists only owned care plans with pagination", async () => {
  const otherRegister = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Other",
      email: "other-phase5@example.com",
      password: "a-strong-demo-password",
    },
  });

  await CarePlan.create({
    userId: otherRegister.body.data.user.id,
    documentId: document._id,
    summary: "Other plan",
    isActive: true,
  });

  const list = await client.request("/api/v1/care-plans?page=1&limit=10", {
    authToken: token,
  });

  assert.equal(list.response.status, 200);
  assert.equal(list.body.data.items.length, 1);
  assert.equal(list.body.data.items[0].id, carePlan._id.toString());
  assert.equal(list.body.data.items[0].clinicallyVerified, false);
});

test("retrieves care plan with extracted vs display summary", async () => {
  const detail = await client.request(`/api/v1/care-plans/${carePlan._id}`, {
    authToken: token,
  });

  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.summary.extracted, "Extracted summary text");
  assert.equal(detail.body.data.openClarificationCount, 1);
});

test("patch caregiver summary preserves extracted value in database", async () => {
  const patch = await client.request(`/api/v1/care-plans/${carePlan._id}`, {
    method: "PATCH",
    authToken: token,
    body: { summary: "Caregiver corrected summary" },
  });

  assert.equal(patch.response.status, 200);
  assert.equal(patch.body.data.summary.display, "Caregiver corrected summary");
  assert.equal(patch.body.data.summary.extracted, "Extracted summary text");

  const stored = await CarePlan.findById(carePlan._id).select("+extractedSnapshot");
  assert.equal(stored.summary, "Extracted summary text");
  assert.equal(stored.caregiverEdits.summary.value, "Caregiver corrected summary");
});

test("review records timestamp without clinical approval", async () => {
  const review = await client.request(
    `/api/v1/care-plans/${carePlan._id}/review`,
    {
      method: "POST",
      authToken: token,
      body: { note: "Reviewed at home" },
    }
  );

  assert.equal(review.response.status, 200);
  assert.ok(review.body.data.review.reviewedByUserAt);
  assert.equal(review.body.data.review.clinicallyVerified, false);
  assert.equal(review.body.data.carePlan.openClarificationCount, 1);
});

test("cannot mark ready while clarifications are open", async () => {
  const patch = await client.request(`/api/v1/care-plans/${carePlan._id}`, {
    method: "PATCH",
    authToken: token,
    body: { status: "ready" },
  });

  assert.equal(patch.response.status, 422);
  assert.equal(patch.body.error.code, "CLARIFICATIONS_OPEN");
});

test("clinical clarification requires resolution note", async () => {
  const plan = await CarePlan.findById(carePlan._id);
  const clarificationId = plan.clarifications[0]._id.toString();

  const denied = await client.request(
    `/api/v1/care-plans/${carePlan._id}/clarifications/${clarificationId}`,
    {
      method: "PATCH",
      authToken: token,
      body: { status: "resolved" },
    }
  );

  assert.equal(denied.response.status, 422);

  const resolved = await client.request(
    `/api/v1/care-plans/${carePlan._id}/clarifications/${clarificationId}`,
    {
      method: "PATCH",
      authToken: token,
      body: {
        status: "resolved",
        resolutionNote: "Pharmacist confirmed dose on phone",
        confirmedWithProfessionalOn: "2026-10-01",
      },
    }
  );

  assert.equal(resolved.response.status, 200);
  assert.equal(resolved.body.data.resolutionHistory.length, 1);
});

test("creates and lists tasks with filters", async () => {
  const create = await client.request("/api/v1/tasks", {
    method: "POST",
    authToken: token,
    body: {
      carePlanId: carePlan._id.toString(),
      documentId: document._id.toString(),
      title: "Morning care",
      category: "care_instruction",
      timezone: "Asia/Kolkata",
      scheduledDate: "2026-10-15",
      status: "pending",
    },
  });

  assert.equal(create.response.status, 201);

  const list = await client.request(
    "/api/v1/tasks?status=pending&category=care_instruction",
    { authToken: token }
  );

  assert.equal(list.response.status, 200);
  assert.equal(list.body.data.items.length, 1);
});

test("rejects inferred medicine times from frequency-only description", async () => {
  const create = await client.request("/api/v1/tasks", {
    method: "POST",
    authToken: token,
    body: {
      carePlanId: carePlan._id.toString(),
      documentId: document._id.toString(),
      title: "Paracetamol twice daily",
      description: "twice daily",
      category: "medication",
      timezone: "Asia/Kolkata",
      scheduledTime: "08:00",
    },
  });

  assert.equal(create.response.status, 422);
  assert.equal(create.body.error.code, "UNSUPPORTED_SCHEDULE_INFERENCE");
});

test("prevents duplicate source-derived tasks", async () => {
  const payload = {
    carePlanId: carePlan._id.toString(),
    documentId: document._id.toString(),
    title: "Source task",
    category: "medication",
    timezone: "Asia/Kolkata",
    isSourceDerived: true,
  };

  const first = await client.request("/api/v1/tasks", {
    method: "POST",
    authToken: token,
    body: payload,
  });
  assert.equal(first.response.status, 201);

  const second = await client.request("/api/v1/tasks", {
    method: "POST",
    authToken: token,
    body: payload,
  });
  assert.equal(second.response.status, 409);
});

test("deleting task does not delete care plan", async () => {
  const task = await Task.create({
    userId,
    carePlanId: carePlan._id,
    documentId: document._id,
    title: "Temp",
    category: "other",
    timezone: "Asia/Kolkata",
  });

  const del = await client.request(`/api/v1/tasks/${task._id}`, {
    method: "DELETE",
    authToken: token,
  });

  assert.equal(del.response.status, 200);
  assert.ok(await CarePlan.findById(carePlan._id));
});

test("follow-up create and duplicate prevention for source-derived", async () => {
  const payload = {
    carePlanId: carePlan._id.toString(),
    documentId: document._id.toString(),
    title: "Cardiology review",
    origin: "source_extracted",
    sourceReferences: [{ quotedText: "Follow up in cardiology clinic" }],
  };

  const first = await client.request("/api/v1/follow-ups", {
    method: "POST",
    authToken: token,
    body: payload,
  });
  assert.equal(first.response.status, 201);

  const second = await client.request("/api/v1/follow-ups", {
    method: "POST",
    authToken: token,
    body: payload,
  });
  assert.equal(second.response.status, 409);

  const list = await client.request("/api/v1/follow-ups?status=upcoming", {
    authToken: token,
  });
  assert.equal(list.body.data.items.length, 1);
});

test("caregiver-entered follow-up without invented appointment time", async () => {
  const create = await client.request("/api/v1/follow-ups", {
    method: "POST",
    authToken: token,
    body: {
      carePlanId: carePlan._id.toString(),
      documentId: document._id.toString(),
      title: "GP visit",
      appointmentDate: "2026-11-01",
      origin: "caregiver_entered",
    },
  });

  assert.equal(create.response.status, 201);
  assert.equal(create.body.data.appointmentTime, null);
});
