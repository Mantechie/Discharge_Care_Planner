# Document-grounded chat (Phase 6)

## Endpoints

- `POST /api/v1/chat`
- `GET /api/v1/chat/history?documentId=...&page=1&limit=50`
- `DELETE /api/v1/chat/history?documentId=...`

## Provider configuration

Uses the same `AI_PROVIDER` / `AI_API_KEY` settings as structured extraction.

- `AI_PROVIDER=gemini` — live answers when `AI_API_KEY` is set.
- `AI_PROVIDER=mock` — answers only when `ALLOW_TEST_EXTRACTION_FIXTURE=true` or `ALLOW_TEST_CHAT_FIXTURE=true` and the document pages include the test fixture marker.

## Safety

Answers are validated as structured JSON, citations are verified against retrieved passages and extracted page text, and emergency user messages receive general safety guidance (not document extraction).
