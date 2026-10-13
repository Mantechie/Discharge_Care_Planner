import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createApp } from "../../src/app.js";
import { Document } from "../../src/models/Document.js";
import { TestClient } from "../helpers/testClient.js";
import { getTestAppConfig } from "../helpers/testConfig.js";
import {
  connectTestDatabase,
  clearDatabase,
  disconnectTestDatabase,
} from "../helpers/testDb.js";
import {
  createSyntheticPdfBytes,
  createPngBytes,
  createCorruptedPdfBytes,
  createEncryptedPdfBytes,
} from "../helpers/documentFixtures.js";

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
      name: "Uploader",
      email: "uploader@example.com",
      password: "a-strong-demo-password",
    },
  });

  token = register.body.data.accessToken;
});

after(async () => {
  await client.stop();
  await disconnectTestDatabase();
  await fs.rm(config.uploadDir, { recursive: true, force: true });
});

async function uploadBuffer({
  buffer,
  filename,
  contentType,
  authToken = token,
}) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([buffer], { type: contentType }),
    filename
  );

  const cookieHeader = client.cookieHeader();
  const headers = {};

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(
    `http://127.0.0.1:${client.port}/api/v1/documents`,
    {
      method: "POST",
      headers,
      body: form,
    }
  );

  client.storeCookies(response);
  const body = await response.json();
  return { response, body };
}

test("uploads a valid synthetic PDF and extracts text", async () => {
  const pdfBytes = await createSyntheticPdfBytes(
    "Take medicine twice daily after food."
  );
  const { response, body } = await uploadBuffer({
    buffer: pdfBytes,
    filename: "sample-discharge-summary.pdf",
    contentType: "application/pdf",
  });

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data.id);
  assert.equal(body.data.extractionMethod, "pdf_text");
  assert.equal(body.data.hasReadableText, true);
  assert.ok(body.data.pageCount >= 1);

  const source = await client.request(
    `/api/v1/documents/${body.data.id}/source`,
    { authToken: token }
  );

  assert.equal(source.response.status, 200);
  assert.match(source.body.data.text, /twice daily/i);
});

test("uploads a supported PNG and uses OCR mock pipeline", async () => {
  const { response, body } = await uploadBuffer({
    buffer: createPngBytes(),
    filename: "scan.png",
    contentType: "image/png",
  });

  assert.equal(response.status, 201);
  assert.equal(body.data.extractionMethod, "ocr");
  assert.equal(body.data.hasReadableText, true);
});

test("rejects missing file", async () => {
  const response = await fetch(
    `http://127.0.0.1:${client.port}/api/v1/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: new FormData(),
    }
  );

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, "FILE_REQUIRED");
});

test("rejects spoofed MIME type with invalid signature", async () => {
  const { response, body } = await uploadBuffer({
    buffer: Buffer.from("not-a-real-file"),
    filename: "fake.pdf",
    contentType: "application/pdf",
  });

  assert.equal(response.status, 415);
  assert.equal(body.error.code, "UNSUPPORTED_MEDIA_TYPE");
});

test("rejects corrupted PDF", async () => {
  const { response, body } = await uploadBuffer({
    buffer: createCorruptedPdfBytes(),
    filename: "broken.pdf",
    contentType: "application/pdf",
  });

  assert.equal(response.status, 201);
  assert.equal(body.data.status, "failed");
  assert.ok(body.data.processingErrors.includes("PDF_PARSE_FAILED"));
});

test("uploads password-protected PDF without crashing", async () => {
  const { response, body } = await uploadBuffer({
    buffer: await createEncryptedPdfBytes(),
    filename: "encrypted.pdf",
    contentType: "application/pdf",
  });

  assert.equal(response.status, 201);
  assert.ok(body.data.id);

  if (body.data.status === "failed") {
    assert.ok(
      body.data.processingErrors.some((code) =>
        ["PDF_ENCRYPTED", "PDF_PARSE_FAILED"].includes(code)
      )
    );
  }
});

test("reprocess reuses the same document record", async () => {
  const pdfBytes = await createSyntheticPdfBytes("Reprocess synthetic text.");
  const upload = await uploadBuffer({
    buffer: pdfBytes,
    filename: "reprocess.pdf",
    contentType: "application/pdf",
  });

  const reprocess = await client.request(
    `/api/v1/documents/${upload.body.data.id}/reprocess`,
    { method: "POST", authToken: token }
  );

  assert.equal(reprocess.response.status, 200);
  assert.equal(reprocess.body.data.id, upload.body.data.id);
});

test("delete removes document metadata and reports storage status", async () => {
  const pdfBytes = await createSyntheticPdfBytes("Delete synthetic text.");
  const upload = await uploadBuffer({
    buffer: pdfBytes,
    filename: "delete-me.pdf",
    contentType: "application/pdf",
  });

  const deleted = await client.request(
    `/api/v1/documents/${upload.body.data.id}`,
    { method: "DELETE", authToken: token }
  );

  assert.equal(deleted.response.status, 200);
  assert.equal(deleted.body.data.storageDeleted, true);

  const missing = await client.request(
    `/api/v1/documents/${upload.body.data.id}`,
    { authToken: token }
  );
  assert.equal(missing.response.status, 404);
});

test("user cannot access another users document source", async () => {
  const pdfBytes = await createSyntheticPdfBytes("Private source text.");
  const upload = await uploadBuffer({
    buffer: pdfBytes,
    filename: "private.pdf",
    contentType: "application/pdf",
  });

  const other = new TestClient(app);
  await other.start();
  const otherRegister = await other.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Other",
      email: "other@example.com",
      password: "a-strong-demo-password",
    },
  });

  const denied = await other.request(
    `/api/v1/documents/${upload.body.data.id}/source`,
    { authToken: otherRegister.body.data.accessToken }
  );

  assert.equal(denied.response.status, 404);
  await other.stop();
});

test("OCR unavailable marks image upload as review_required", async () => {
  const noOcrApp = createApp({
    ...config,
    ocrProvider: "none",
    allowTestOcrMock: false,
  });
  const noOcrClient = new TestClient(noOcrApp);
  await noOcrClient.start();

  const register = await noOcrClient.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "No OCR",
      email: "no-ocr@example.com",
      password: "a-strong-demo-password",
    },
  });

  const form = new FormData();
  form.append(
    "file",
    new Blob([createPngBytes()], { type: "image/png" }),
    "scan.png"
  );

  const response = await fetch(
    `http://127.0.0.1:${noOcrClient.port}/api/v1/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${register.body.data.accessToken}`,
      },
      body: form,
    }
  );

  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.data.status, "review_required");
  assert.ok(body.data.processingErrors.includes("OCR_NOT_CONFIGURED"));

  await noOcrClient.stop();
});
