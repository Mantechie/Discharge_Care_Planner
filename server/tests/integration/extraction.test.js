import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { CarePlan } from "../../src/models/CarePlan.js";
import { TestClient } from "../helpers/testClient.js";
import { getTestAppConfig } from "../helpers/testConfig.js";
import {
  connectTestDatabase,
  clearDatabase,
  disconnectTestDatabase,
} from "../helpers/testDb.js";
import { createFixtureExtractionPdfBytes } from "../helpers/documentFixtures.js";

const config = getTestAppConfig();
const app = createApp(config);
const client = new TestClient(app);
let token;

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
      name: "Extractor",
      email: "extractor@example.com",
      password: "a-strong-demo-password",
    },
  });

  token = register.body.data.accessToken;
});

after(async () => {
  await client.stop();
  await disconnectTestDatabase();
});

async function uploadFixturePdf() {
  const pdfBytes = await createFixtureExtractionPdfBytes();
  const form = new FormData();
  form.append(
    "file",
    new Blob([pdfBytes], { type: "application/pdf" }),
    "fixture.pdf"
  );

  const response = await fetch(
    `http://127.0.0.1:${client.port}/api/v1/documents`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  const body = await response.json();
  return body.data.id;
}

test("runs structured extraction and returns a draft care plan", async () => {
  const documentId = await uploadFixturePdf();

  const extract = await client.request(
    `/api/v1/documents/${documentId}/extract`,
    { method: "POST", authToken: token }
  );

  assert.equal(extract.response.status, 201);
  assert.ok(extract.body.data.carePlanId);

  const result = await client.request(
    `/api/v1/documents/${documentId}/extraction`,
    { authToken: token }
  );

  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.extraction.medications.length, 1);
  assert.equal(
    result.body.data.extraction.medications[0].extracted.foodInstruction,
    "after_food"
  );
  assert.equal(result.body.data.extraction.medications[0].extracted.timing, null);
  assert.equal(result.body.data.extraction.clinicallyVerified, false);
});

test("reprocess-extraction archives prior active plan", async () => {
  const documentId = await uploadFixturePdf();
  const first = await client.request(
    `/api/v1/documents/${documentId}/extract`,
    { method: "POST", authToken: token }
  );

  const reprocess = await client.request(
    `/api/v1/documents/${documentId}/reprocess-extraction`,
    { method: "POST", authToken: token }
  );

  assert.equal(reprocess.response.status, 200);
  assert.notEqual(
    reprocess.body.data.carePlanId,
    first.body.data.carePlanId
  );

  const activePlans = await CarePlan.countDocuments({
    documentId,
    isActive: true,
  });
  assert.equal(activePlans, 1);
});

test("user cannot extract another users document", async () => {
  const documentId = await uploadFixturePdf();
  const other = new TestClient(app);
  await other.start();

  const otherRegister = await other.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Other",
      email: "other-extract@example.com",
      password: "a-strong-demo-password",
    },
  });

  const denied = await other.request(
    `/api/v1/documents/${documentId}/extract`,
    {
      method: "POST",
      authToken: otherRegister.body.data.accessToken,
    }
  );

  assert.equal(denied.response.status, 404);
  await other.stop();
});

test("mock provider without fixture marker does not fabricate success", async () => {
  const noFixtureApp = createApp({
    ...config,
    allowTestExtractionFixture: false,
  });
  const localClient = new TestClient(noFixtureApp);
  await localClient.start();

  const register = await localClient.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "No Fixture",
      email: "no-fixture@example.com",
      password: "a-strong-demo-password",
    },
  });

  const pdfBytes = await createFixtureExtractionPdfBytes();
  const form = new FormData();
  form.append(
    "file",
    new Blob([pdfBytes], { type: "application/pdf" }),
    "fixture.pdf"
  );

  const upload = await fetch(
    `http://127.0.0.1:${localClient.port}/api/v1/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${register.body.data.accessToken}`,
      },
      body: form,
    }
  );
  const uploadBody = await upload.json();

  const extract = await localClient.request(
    `/api/v1/documents/${uploadBody.data.id}/extract`,
    {
      method: "POST",
      authToken: register.body.data.accessToken,
    }
  );

  assert.equal(extract.response.status, 503);
  assert.equal(extract.body.error.code, "AI_PROVIDER_UNAVAILABLE");

  await localClient.stop();
});
