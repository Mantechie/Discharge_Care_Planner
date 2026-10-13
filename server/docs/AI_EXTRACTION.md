# AI extraction and safety validation (Phase 4)

## Providers

| `AI_PROVIDER` | Behavior |
| --- | --- |
| `mock` | Returns structured output **only** when the extracted source text contains the test marker `[[DC_TEST_EXTRACTION_FIXTURE]]` and `ALLOW_TEST_EXTRACTION_FIXTURE=true`. Never fabricates medical content for real uploads. |
| `gemini` | Uses `@google/genai` with `AI_API_KEY` (or legacy `GEMINI_API_KEY`) and `AI_MODEL`. Sends document page text to Google’s API. |

If credentials are missing or the provider fails, the API returns a controlled error and does not create a false successful extraction.

## Endpoints

- `POST /api/v1/documents/:documentId/extract`
- `GET /api/v1/documents/:documentId/extraction`
- `POST /api/v1/documents/:documentId/reprocess-extraction`
- `GET /api/v1/care-plans/:carePlanId`

## Privacy note

When `AI_PROVIDER=gemini`, extracted discharge-summary text is sent to the configured external model. Review data-sharing policies before enabling this in production.
