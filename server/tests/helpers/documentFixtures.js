import { PDFDocument, StandardFonts } from "pdf-lib";
import { EXTRACTION_FIXTURE_MARKER } from "../../src/services/extraction.fixtures.js";

export async function createFixtureExtractionPdfBytes() {
  return createSyntheticPdfBytes(
    `${EXTRACTION_FIXTURE_MARKER}\nTake one tablet twice daily after food.\nRest and drink fluids as documented.\nReturn if fever persists.\nFollow up with physician.`
  );
}

export async function createSyntheticPdfBytes(text = "Synthetic discharge summary test line.") {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([400, 400]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 300, size: 12, font });
  return Buffer.from(await pdf.save());
}

export function createPngBytes() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
}

export function createCorruptedPdfBytes() {
  return Buffer.from("%PDF-1.4\n% corrupted content without valid xref", "utf8");
}

export async function createEncryptedPdfBytes() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  page.drawText("Encrypted synthetic test", { x: 50, y: 700, size: 12 });
  return Buffer.from(
    await pdf.save({
      userPassword: "test-password",
      ownerPassword: "owner-password",
    })
  );
}
