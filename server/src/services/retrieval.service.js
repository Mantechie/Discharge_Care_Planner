import { verifySourceReference } from "../utils/sourceReferences.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "my",
  "me",
  "i",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "this",
  "that",
  "does",
  "do",
  "what",
  "when",
  "where",
  "how",
  "say",
  "says",
  "document",
  "summary",
  "discharge",
  "medicine",
  "medication",
  "क्या",
  "मेरा",
  "मेरी",
]);

function tokenizeQuery(query) {
  return String(query || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function scorePageText(tokens, text) {
  if (!tokens.length || !text) {
    return 0;
  }

  const normalized = text.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (normalized.includes(token)) {
      score += 1;
    }
  }

  return score;
}

function chunkPageText(pageNumber, text, maxChunkChars) {
  const paragraphs = String(text || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks = [];

  for (const paragraph of paragraphs.length ? paragraphs : [text || ""]) {
    if (paragraph.length <= maxChunkChars) {
      chunks.push({
        pageNumber,
        text: paragraph,
        quotedText: paragraph.slice(0, 500),
      });
      continue;
    }

    for (let start = 0; start < paragraph.length; start += maxChunkChars) {
      const slice = paragraph.slice(start, start + maxChunkChars).trim();
      if (slice) {
        chunks.push({
          pageNumber,
          text: slice,
          quotedText: slice.slice(0, 500),
        });
      }
    }
  }

  return chunks;
}

function dedupePassages(passages) {
  const seen = new Set();
  const result = [];

  for (const passage of passages) {
    const key = `${passage.pageNumber}:${passage.text.slice(0, 120)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(passage);
  }

  return result;
}

export function retrievePassagesFromDocument({
  pages,
  query,
  maxPassages = 8,
  maxTotalChars = 12000,
  maxChunkChars = 1200,
}) {
  const tokens = tokenizeQuery(query);
  const candidates = [];

  for (const page of pages || []) {
    const pageNumber = page.pageNumber ?? page.page;
    if (!pageNumber) {
      continue;
    }

    const chunks = chunkPageText(pageNumber, page.text || "", maxChunkChars);

    for (const chunk of chunks) {
      const relevance = scorePageText(tokens, chunk.text);
      candidates.push({
        passageId: `p${pageNumber}-${candidates.length}`,
        pageNumber,
        text: chunk.text,
        quotedText: chunk.quotedText,
        relevance,
      });
    }
  }

  candidates.sort((a, b) => b.relevance - a.relevance);

  const ranked =
    candidates.some((item) => item.relevance > 0)
      ? candidates.filter((item) => item.relevance > 0)
      : candidates.slice(0, Math.min(3, candidates.length));

  const selected = [];
  let totalChars = 0;

  for (const passage of dedupePassages(ranked)) {
    if (selected.length >= maxPassages) {
      break;
    }

    if (totalChars + passage.text.length > maxTotalChars) {
      break;
    }

    selected.push(passage);
    totalChars += passage.text.length;
  }

  return {
    passages: selected,
    tokens,
    hasEvidence: selected.length > 0,
  };
}

export function buildClarificationContext(carePlan) {
  if (!carePlan) {
    return [];
  }

  return (carePlan.clarifications || [])
    .filter((item) => item.status === "open")
    .map((item) => ({
      field: item.field,
      reason: item.reason,
      requiresProfessionalConfirmation: item.requiresProfessionalConfirmation,
      reviewPriority: item.reviewPriority,
      sourceReferences: item.sourceReferences || [],
    }));
}

export function verifyChatCitations(citations, sourcePages, retrievedPassages) {
  const verified = [];
  const issues = [];
  const retrievedQuotes = new Set(
    retrievedPassages.map((item) =>
      String(item.quotedText || item.text || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
    )
  );

  for (const citation of citations || []) {
    const check = verifySourceReference(
      {
        pageNumber: citation.pageNumber,
        quotedText: citation.quotedText,
        startOffset: citation.startOffset,
        endOffset: citation.endOffset,
        referencePrecision: citation.referencePrecision,
      },
      sourcePages
    );

    if (!check.valid) {
      issues.push(...check.issues);
      continue;
    }

    const normalizedQuote = String(citation.quotedText || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (
      normalizedQuote &&
      retrievedQuotes.size > 0 &&
      !retrievedQuotes.has(normalizedQuote) &&
      !retrievedPassages.some((passage) =>
        passage.text.toLowerCase().includes(normalizedQuote)
      )
    ) {
      issues.push("CITATION_NOT_IN_RETRIEVAL");
      continue;
    }

    verified.push({
      pageNumber: citation.pageNumber ?? check.normalized.page ?? null,
      quotedText: citation.quotedText ?? null,
      startOffset: citation.startOffset ?? null,
      endOffset: citation.endOffset ?? null,
      referencePrecision: citation.referencePrecision ?? check.normalized.referencePrecision,
      sourceReferenceId: citation.sourceReferenceId ?? null,
    });
  }

  return { verified, issues };
}
