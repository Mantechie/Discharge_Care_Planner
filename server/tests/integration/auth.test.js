import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createApp } from "../../src/app.js";
import { User } from "../../src/models/User.js";
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
});

const registerPayload = {
  name: "Demo Caregiver",
  email: "caregiver@example.com",
  password: "a-strong-demo-password",
};

test("registration succeeds and returns safe profile", async () => {
  const { response, body } = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.user.email, "caregiver@example.com");
  assert.equal(body.data.user.preferredLanguage, "en");
  assert.ok(body.data.accessToken);
  assert.equal(body.data.user.passwordHash, undefined);
});

test("registration rejects invalid data", async () => {
  const { response, body } = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: { name: "A", email: "bad-email", password: "short" },
  });

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
});

test("registration rejects duplicate email", async () => {
  await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  client.cookies.clear();
  client.csrfToken = null;

  const { response, body } = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  assert.equal(response.status, 409);
  assert.equal(body.error.code, "EMAIL_ALREADY_EXISTS");
});

test("password is hashed and never returned", async () => {
  await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  const user = await User.findOne({ email: "caregiver@example.com" }).select(
    "+passwordHash"
  );

  assert.ok(user.passwordHash);
  assert.notEqual(user.passwordHash, registerPayload.password);
  assert.equal(
    await bcrypt.compare(registerPayload.password, user.passwordHash),
    true
  );
});

test("login succeeds with valid credentials", async () => {
  await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  client.cookies.clear();
  client.csrfToken = null;

  const { response, body } = await client.request("/api/v1/auth/login", {
    method: "POST",
    body: {
      email: registerPayload.email,
      password: registerPayload.password,
    },
  });

  assert.equal(response.status, 200);
  assert.ok(body.data.accessToken);
});

test("login rejects invalid credentials generically", async () => {
  await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  client.cookies.clear();
  client.csrfToken = null;

  const { response, body } = await client.request("/api/v1/auth/login", {
    method: "POST",
    body: {
      email: registerPayload.email,
      password: "wrong-password-value",
    },
  });

  assert.equal(response.status, 401);
  assert.equal(body.error.message, "Invalid email or password.");
});

test("access token works for /auth/me", async () => {
  const { body: registerBody } = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  const { response, body } = await client.request("/api/v1/auth/me", {
    authToken: registerBody.data.accessToken,
  });

  assert.equal(response.status, 200);
  assert.equal(body.data.email, "caregiver@example.com");
  assert.equal(body.data.passwordHash, undefined);
});

test("invalid access token is rejected", async () => {
  const { response, body } = await client.request("/api/v1/auth/me", {
    authToken: "invalid.token.value",
  });

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "UNAUTHORIZED");
});

test("expired access token is rejected", async () => {
  const expiredToken = jwt.sign(
    { sub: "507f1f77bcf86cd799439011" },
    config.jwtSecret,
    {
      expiresIn: -10,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }
  );

  const { response, body } = await client.request("/api/v1/auth/me", {
    authToken: expiredToken,
  });

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "UNAUTHORIZED");
});

test("refresh rotates refresh token", async () => {
  await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  const oldRefresh = client.cookies.get("dc_refresh_token");

  const { response, body } = await client.request("/api/v1/auth/refresh", {
    method: "POST",
  });

  assert.equal(response.status, 200);
  assert.ok(body.data.accessToken);
  assert.notEqual(client.cookies.get("dc_refresh_token"), oldRefresh);
});

test("reused revoked refresh token is rejected", async () => {
  await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  const oldRefresh = client.cookies.get("dc_refresh_token");
  const oldCsrf = client.csrfToken;

  await client.request("/api/v1/auth/refresh", { method: "POST" });

  client.cookies.set("dc_refresh_token", oldRefresh);
  client.csrfToken = oldCsrf;

  const { response, body } = await client.request("/api/v1/auth/refresh", {
    method: "POST",
  });

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "REFRESH_TOKEN_REUSE");
});

test("logout revokes refresh token", async () => {
  await client.request("/api/v1/auth/register", {
    method: "POST",
    body: registerPayload,
  });

  await client.request("/api/v1/auth/logout", { method: "POST" });

  const { response, body } = await client.request("/api/v1/auth/refresh", {
    method: "POST",
  });

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "UNAUTHORIZED");
});
