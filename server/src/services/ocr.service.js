import fs from "node:fs/promises";
import path from "node:path";
import { pdf } from "pdf-to-img";

let tesseractWorkerPromise;

async function getTesseractWorker(languages) {
  if (!tesseractWorkerPromise) {
    const { createWorker } = await import("tesseract.js");
    tesseractWorkerPromise = createWorker(languages);
  }

  return tesseractWorkerPromise;
}

async function terminateTesseractWorker() {
  if (tesseractWorkerPromise) {
    const worker = await tesseractWorkerPromise;
    await worker.terminate();
    tesseractWorkerPromise = null;
  }
}

async function ocrImageBuffer(buffer, { languages, pageNumber = 1 }) {
  const worker = await getTesseractWorker(languages);
  const result = await worker.recognize(buffer);

  return {
    pageNumber,
    text: result.data.text?.trim() || "",
    confidence: result.data.confidence ?? null,
  };
}

export async function isOcrAvailable(config) {
  if (config.ocrProvider === "tesseract") {
    return true;
  }

  if (config.ocrProvider === "mock" && config.allowTestOcrMock) {
    return true;
  }

  return false;
}

export async function runOcrOnImageFile(filePath, config, pageNumber = 1) {
  if (config.ocrProvider === "none") {
    return {
      available: false,
      error: "OCR_NOT_CONFIGURED",
      pages: [],
      text: "",
      hasReadableText: false,
    };
  }

  if (config.ocrProvider === "mock" && config.allowTestOcrMock) {
    return {
      available: true,
      method: "ocr",
      pages: [
        {
          pageNumber,
          text: "SYNTHETIC_OCR_TEST_LINE",
          confidence: 90,
        },
      ],
      text: "SYNTHETIC_OCR_TEST_LINE",
      hasReadableText: true,
      warnings: ["TEST_OCR_MOCK"],
    };
  }

  if (config.ocrProvider !== "tesseract") {
    return {
      available: false,
      error: "OCR_PROVIDER_UNSUPPORTED",
      pages: [],
      text: "",
      hasReadableText: false,
    };
  }

  try {
    const buffer = await fs.readFile(filePath);
    const page = await ocrImageBuffer(buffer, {
      languages: config.ocrLanguages,
      pageNumber,
    });

    return {
      available: true,
      method: "ocr",
      pages: [page],
      text: page.text,
      hasReadableText: page.text.length > 0,
    };
  } catch (error) {
    return {
      available: true,
      method: "ocr",
      pages: [],
      text: "",
      hasReadableText: false,
      error: "OCR_FAILED",
      message: error.message,
    };
  }
}

export async function runOcrOnPdfPages(filePath, config) {
  if (!(await isOcrAvailable(config))) {
    return {
      available: false,
      error: "OCR_NOT_CONFIGURED",
      pages: [],
      text: "",
      hasReadableText: false,
    };
  }

  if (config.ocrProvider === "mock" && config.allowTestOcrMock) {
    return {
      available: true,
      method: "ocr",
      pages: [{ pageNumber: 1, text: "SYNTHETIC_OCR_TEST_LINE", confidence: 90 }],
      text: "SYNTHETIC_OCR_TEST_LINE",
      hasReadableText: true,
      warnings: ["TEST_OCR_MOCK"],
    };
  }

  const pages = [];
  let pageNumber = 0;

  try {
    const document = await pdf(filePath, { scale: 2 });

    for await (const image of document) {
      pageNumber += 1;
      const page = await ocrImageBuffer(image, {
        languages: config.ocrLanguages,
        pageNumber,
      });
      pages.push(page);
    }
  } catch (error) {
    return {
      available: true,
      method: "ocr",
      pages: [],
      text: "",
      hasReadableText: false,
      error: "OCR_PDF_RENDER_FAILED",
      message: error.message,
    };
  }

  const text = pages
    .map((page) => page.text)
    .filter(Boolean)
    .join("\n\n");

  return {
    available: true,
    method: "ocr",
    pages,
    text,
    hasReadableText: text.trim().length > 0,
  };
}

export async function shutdownOcr() {
  await terminateTesseractWorker();
}
