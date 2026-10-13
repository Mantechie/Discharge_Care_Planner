# Document upload and processing (Phase 3)

## Supported formats

- PDF (`application/pdf`)
- JPEG/JPG (`image/jpeg`)
- PNG (`image/png`)
- WEBP (`image/webp`) when `ENABLE_WEBP_UPLOADS=true`

Maximum upload size defaults to **10 MB** (`MAX_FILE_SIZE_MB`).

## Storage

Uploaded files are stored under `UPLOAD_DIR` (default `./storage`) using random keys such as `users/<userId>/<random>`. The directory is private and is not served as static content.

For production, prefer private object storage (S3-compatible bucket, Azure Blob, GCS) with encryption and access controls. Local disk may be ephemeral in container deployments.

## PDF extraction

Digital PDF text is extracted with `pdfjs-dist`, preserving page boundaries where possible.

## OCR

OCR is optional and controlled by `OCR_PROVIDER`:

| Value | Behavior |
| --- | --- |
| `none` (default) | OCR is not run. Image uploads and scanned PDFs without readable text are marked `review_required` with `OCR_NOT_CONFIGURED`. |
| `tesseract` | Uses `tesseract.js` locally with `OCR_LANGUAGES` (default `eng+hin`). Scanned PDF pages are rendered with `pdf-to-img` before OCR. |
| `mock` | **Tests only** when `allowTestOcrMock` is enabled in app config. |

Tesseract language data is downloaded automatically on first use. This can take time on first OCR run.

## API endpoints

All routes require authentication.

- `POST /api/v1/documents`
- `GET /api/v1/documents`
- `GET /api/v1/documents/:documentId`
- `GET /api/v1/documents/:documentId/status`
- `GET /api/v1/documents/:documentId/source`
- `GET /api/v1/documents/:documentId/file`
- `POST /api/v1/documents/:documentId/reprocess`
- `DELETE /api/v1/documents/:documentId`

## Tests

```powershell
cd server
npm test
```

Tests use an isolated directory at `tests/.tmp-storage` and an in-memory MongoDB instance unless `TEST_MONGODB_URI` is set.

## Known limitations

- No background job queue (processing is synchronous).
- No AI medical extraction in Phase 3.
- OCR quality depends on scan quality and configured languages.
- Encrypted PDFs are rejected with `PDF_ENCRYPTED`.
