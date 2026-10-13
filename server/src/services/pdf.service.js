import fs from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const PASSWORD_EXCEPTION_NAMES = new Set([
  "PasswordException",
  "PasswordRequiredException",
]);

function isPasswordProtectedError(error) {
  return (
    PASSWORD_EXCEPTION_NAMES.has(error?.name) ||
    /password/i.test(error?.message || "")
  );
}

export async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = new Uint8Array(buffer);

  let pdfDocument;

  try {
    const loadingTask = getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });
    pdfDocument = await loadingTask.promise;
  } catch (error) {
    if (isPasswordProtectedError(error)) {
      return {
        method: "pdf_text",
        pages: [],
        text: "",
        hasReadableText: false,
        pageCount: 0,
        error: "PDF_ENCRYPTED",
      };
    }

    return {
      method: "pdf_text",
      pages: [],
      text: "",
      hasReadableText: false,
      pageCount: 0,
      error: "PDF_PARSE_FAILED",
      message: error.message,
    };
  }

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber,
      text,
    });
  }

  const text = pages
    .map((page) => page.text)
    .filter(Boolean)
    .join("\n\n");

  return {
    method: "pdf_text",
    pages,
    text,
    hasReadableText: text.trim().length > 0,
    pageCount: pdfDocument.numPages,
  };
}
