import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { extractPdfText } from "../../src/services/pdf.service.js";
import { createSyntheticPdfBytes } from "../helpers/documentFixtures.js";

test("extractPdfText returns page-aware digital PDF text", async () => {
  const tempPath = path.join(os.tmpdir(), `dc-test-${Date.now()}.pdf`);
  const bytes = await createSyntheticPdfBytes("Synthetic page text for extraction.");
  await fs.writeFile(tempPath, bytes);

  const result = await extractPdfText(tempPath);
  await fs.unlink(tempPath);

  assert.equal(result.method, "pdf_text");
  assert.equal(result.hasReadableText, true);
  assert.ok(result.pageCount >= 1);
  assert.match(result.text, /Synthetic page text/i);
});
