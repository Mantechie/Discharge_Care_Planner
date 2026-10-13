import mongoose from "mongoose";

export const REFERENCE_PRECISION = [
  "exact_span",
  "page_excerpt",
  "page_only",
  "unavailable",
];

export const sourceReferenceSchema = new mongoose.Schema(
  {
    page: {
      type: Number,
      min: 1,
      default: null,
    },
    quotedText: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: null,
    },
    startOffset: {
      type: Number,
      min: 0,
      default: null,
    },
    endOffset: {
      type: Number,
      min: 0,
      default: null,
    },
    referencePrecision: {
      type: String,
      enum: REFERENCE_PRECISION,
      default: "unavailable",
    },
  },
  { _id: false }
);

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function mapSourceReferenceForApi(reference) {
  if (!reference) {
    return null;
  }

  return {
    pageNumber: reference.page ?? null,
    quotedText: reference.quotedText ?? null,
    startOffset: reference.startOffset ?? null,
    endOffset: reference.endOffset ?? null,
    referencePrecision: reference.referencePrecision ?? "unavailable",
  };
}

export function mapSourceReferenceFromApi(reference) {
  if (!reference) {
    return null;
  }

  return {
    page: reference.pageNumber ?? reference.page ?? null,
    quotedText: reference.quotedText ?? null,
    startOffset: reference.startOffset ?? null,
    endOffset: reference.endOffset ?? null,
    referencePrecision: reference.referencePrecision ?? "unavailable",
  };
}

export function buildPageIndex(sourcePages) {
  const pages = new Map();

  for (const page of sourcePages || []) {
    const pageNumber = page.pageNumber ?? page.page;
    if (!pageNumber) {
      continue;
    }

    pages.set(pageNumber, {
      pageNumber,
      text: page.text || "",
      normalizedText: normalizeWhitespace(page.text),
    });
  }

  return pages;
}

export function verifySourceReference(reference, sourcePages) {
  const issues = [];
  const pageIndex = buildPageIndex(sourcePages);
  const mapped = mapSourceReferenceFromApi(
    reference?.pageNumber ? reference : mapSourceReferenceForApi(reference)
  );

  if (!mapped) {
    return { valid: false, issues: ["SOURCE_REFERENCE_MISSING"] };
  }

  const { page, quotedText, startOffset, endOffset, referencePrecision } =
    mapped;

  if (page != null && !pageIndex.has(page)) {
    issues.push("SOURCE_PAGE_INVALID");
  }

  if (quotedText) {
    const normalizedQuote = normalizeWhitespace(quotedText);
    let found = false;

    if (page != null && pageIndex.has(page)) {
      found = pageIndex.get(page).normalizedText.includes(normalizedQuote);
    } else {
      found = [...pageIndex.values()].some((entry) =>
        entry.normalizedText.includes(normalizedQuote)
      );
    }

    if (!found) {
      issues.push("SOURCE_QUOTE_UNVERIFIED");
    }
  } else if (referencePrecision !== "page_only" && page == null) {
    issues.push("SOURCE_REFERENCE_INCOMPLETE");
  }

  if (
    startOffset != null &&
    endOffset != null &&
    page != null &&
    pageIndex.has(page)
  ) {
    const pageText = pageIndex.get(page).text;
    const excerpt = pageText.slice(startOffset, endOffset);

    if (quotedText && normalizeWhitespace(excerpt) !== normalizeWhitespace(quotedText)) {
      issues.push("SOURCE_OFFSET_MISMATCH");
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    normalized: mapped,
  };
}
