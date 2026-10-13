import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../../src/config/env.js";

test("loadEnv requires MONGODB_URI", () => {
  const original = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "";

  try {
    assert.throws(() => loadEnv(), /MONGODB_URI is required/);
  } finally {
    process.env.MONGODB_URI = original;
  }
});

test("loadEnv rejects mock AI provider in production", () => {
  const originals = {
    nodeEnv: process.env.NODE_ENV,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    aiProvider: process.env.AI_PROVIDER,
  };

  process.env.NODE_ENV = "production";
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/dischargecare";
  process.env.JWT_SECRET = "a-production-secret-with-sufficient-length-value";
  process.env.AI_PROVIDER = "mock";

  try {
    assert.throws(() => loadEnv(), /AI_PROVIDER cannot be mock/);
  } finally {
    process.env.NODE_ENV = originals.nodeEnv;
    process.env.MONGODB_URI = originals.mongodbUri;
    process.env.JWT_SECRET = originals.jwtSecret;
    process.env.AI_PROVIDER = originals.aiProvider;
  }
});

test("loadEnv requires a production JWT_SECRET", () => {
  const originals = {
    nodeEnv: process.env.NODE_ENV,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
  };

  process.env.NODE_ENV = "production";
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/dischargecare";
  process.env.JWT_SECRET = "replace_with_a_long_random_secret";

  try {
    assert.throws(() => loadEnv(), /JWT_SECRET must be set/);
  } finally {
    process.env.NODE_ENV = originals.nodeEnv;
    process.env.MONGODB_URI = originals.mongodbUri;
    process.env.JWT_SECRET = originals.jwtSecret;
  }
});
