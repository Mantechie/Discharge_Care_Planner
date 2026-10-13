import { test } from "node:test";
import assert from "node:assert/strict";
import {
  retrievePassagesFromDocument,
  verifyChatCitations,
} from "../../src/services/retrieval.service.js";

test("retrievePassagesFromDocument ranks relevant pages", () => {
  const result = retrievePassagesFromDocument({
    pages: [
      { pageNumber: 1, text: "General advice only." },
      { pageNumber: 2, text: "Take medicine after food twice daily." },
    ],
    query: "after food medicine",
    maxPassages: 2,
  });

  assert.ok(result.hasEvidence);
  assert.equal(result.passages[0].pageNumber, 2);
});

test("verifyChatCitations rejects fabricated quotes", () => {
  const pages = [{ pageNumber: 1, text: "Take one tablet after food." }];
  const retrieved = [
    {
      pageNumber: 1,
      text: "Take one tablet after food.",
      quotedText: "Take one tablet after food.",
    },
  ];

  const valid = verifyChatCitations(
    [{ pageNumber: 1, quotedText: "Take one tablet after food." }],
    pages,
    retrieved
  );
  assert.equal(valid.verified.length, 1);

  const invalid = verifyChatCitations(
    [{ pageNumber: 99, quotedText: "Invented quote" }],
    pages,
    retrieved
  );
  assert.equal(invalid.verified.length, 0);
});
