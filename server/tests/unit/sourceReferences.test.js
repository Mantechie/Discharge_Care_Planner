import { test } from "node:test";
import assert from "node:assert/strict";
import { verifySourceReference } from "../../src/utils/sourceReferences.js";

const sourcePages = [
  {
    pageNumber: 1,
    text: "Take one tablet twice daily after food.",
  },
];

test("verifies a matching quoted passage", () => {
  const result = verifySourceReference(
    {
      pageNumber: 1,
      quotedText: "Take one tablet twice daily after food",
      referencePrecision: "page_excerpt",
    },
    sourcePages
  );

  assert.equal(result.valid, true);
});

test("flags an incorrect quotation", () => {
  const result = verifySourceReference(
    {
      pageNumber: 1,
      quotedText: "Completely fabricated quote",
      referencePrecision: "page_excerpt",
    },
    sourcePages
  );

  assert.equal(result.valid, false);
  assert.ok(result.issues.includes("SOURCE_QUOTE_UNVERIFIED"));
});

test("flags an invalid page number", () => {
  const result = verifySourceReference(
    {
      pageNumber: 9,
      quotedText: "Take one tablet",
      referencePrecision: "page_excerpt",
    },
    sourcePages
  );

  assert.equal(result.valid, false);
  assert.ok(result.issues.includes("SOURCE_PAGE_INVALID"));
});
