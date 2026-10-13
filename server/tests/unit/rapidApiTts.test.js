import { test } from "node:test";
import assert from "node:assert/strict";
import { synthesizeRapidApiSpeech } from "../../src/services/rapidApiTts.service.js";

test("synthesizeRapidApiSpeech returns audio buffer from binary response", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    headers: { get: () => "audio/mpeg" },
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  });

  try {
    const result = await synthesizeRapidApiSpeech(
      { text: "Hello", language: "en" },
      { rapidApiKey: "test-key" }
    );
    assert.equal(result.contentType, "audio/mpeg");
    assert.equal(result.buffer.length, 3);
  } finally {
    global.fetch = originalFetch;
  }
});

test("synthesizeRapidApiSpeech requires configured key", async () => {
  await assert.rejects(
    () => synthesizeRapidApiSpeech({ text: "Hi" }, { rapidApiKey: "" }),
    (error) => error.code === "AI_CREDENTIALS_MISSING"
  );
});
