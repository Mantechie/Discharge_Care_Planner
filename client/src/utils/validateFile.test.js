import { describe, expect, it } from "vitest";
import { validateSelectedFile } from "./validateFile.js";
import { MAX_FILE_SIZE_BYTES } from "../constants/upload.js";

function makeFile({ name, type, size }) {
  return { name, type, size };
}

describe("validateSelectedFile", () => {
  it("rejects missing file", () => {
    expect(validateSelectedFile(null)).toEqual({
      valid: false,
      reason: "idle",
    });
  });

  it("accepts valid PDF", () => {
    const file = makeFile({
      name: "summary.pdf",
      type: "application/pdf",
      size: 1024,
    });
    expect(validateSelectedFile(file)).toEqual({ valid: true, reason: null });
  });

  it("accepts valid PNG image", () => {
    const file = makeFile({
      name: "scan.png",
      type: "image/png",
      size: 2048,
    });
    expect(validateSelectedFile(file)).toEqual({ valid: true, reason: null });
  });

  it("rejects unsupported format", () => {
    const file = makeFile({
      name: "notes.txt",
      type: "text/plain",
      size: 100,
    });
    expect(validateSelectedFile(file).valid).toBe(false);
    expect(validateSelectedFile(file).reason).toBe("unsupported_file");
  });

  it("rejects oversized file", () => {
    const file = makeFile({
      name: "huge.pdf",
      type: "application/pdf",
      size: MAX_FILE_SIZE_BYTES + 1,
    });
    expect(validateSelectedFile(file)).toEqual({
      valid: false,
      reason: "file_too_large",
    });
  });
});
