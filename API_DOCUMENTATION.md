# DischargeCare API Reference

**Base URL:** `http://localhost:5000/api/v1` (configurable via `API_PREFIX`)  
**Auth:** Bearer access token on private routes (`Authorization: Bearer <token>`). Refresh via HTTP-only cookie + CSRF on `/auth/refresh` and `/auth/logout`.

## Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| GET | `/health/ready` | No (503 if MongoDB disconnected) |

Legacy: `GET /api/health` (React client).

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register (optional `preferredLanguage`, `timezone`) |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Rotate session (CSRF) |
| POST | `/auth/logout` | Logout (CSRF) |
| GET | `/auth/me` | Current user profile |

## Users

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/users/me/preferences` | `preferredLanguage` (`en`/`hi`), `timezone` (IANA) |

## Documents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/documents` | List |
| POST | `/documents` | Upload (multipart `file`) |
| GET | `/documents/:documentId` | Detail |
| DELETE | `/documents/:documentId` | Delete + cleanup |
| GET | `/documents/:documentId/status` | Processing status |
| GET | `/documents/:documentId/source` | Source text/pages |
| GET | `/documents/:documentId/file` | Download file |
| POST | `/documents/:documentId/reprocess` | Re-run PDF/OCR |
| POST | `/documents/:documentId/extract` | AI extraction (rate limited) |
| GET | `/documents/:documentId/extraction` | Extraction result |
| POST | `/documents/:documentId/reprocess-extraction` | Re-extract (rate limited) |

## Care plans

| Method | Path | Description |
|--------|------|-------------|
| GET | `/care-plans` | List (pagination, filters) |
| GET | `/care-plans/:carePlanId` | Detail (extracted vs display) |
| PATCH | `/care-plans/:carePlanId` | Caregiver-safe edits |
| POST | `/care-plans/:carePlanId/review` | Record caregiver review (not clinical approval) |
| GET | `/care-plans/:carePlanId/clarifications` | Open issues |
| PATCH | `/care-plans/:carePlanId/clarifications/:clarificationId` | Resolve/dismiss with note when required |

## Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List (date, status, category, …) |
| POST | `/tasks` | Create |
| GET | `/tasks/:taskId` | Get |
| PATCH | `/tasks/:taskId` | Update |
| DELETE | `/tasks/:taskId` | Delete |

## Follow-ups

| Method | Path | Description |
|--------|------|-------------|
| GET | `/follow-ups` | List |
| POST | `/follow-ups` | Create |
| GET | `/follow-ups/:followUpId` | Get |
| PATCH | `/follow-ups/:followUpId` | Update |
| DELETE | `/follow-ups/:followUpId` | Delete |

## Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | Ask question (`documentId`, `message`, `language`) |
| GET | `/chat/history` | Paginated history (`documentId`) |
| DELETE | `/chat/history` | Delete history for document |

## Reminders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reminders/settings` | Settings + localized template + delivery metadata |
| GET | `/reminders/template` | Template preview (`?language=en\|hi`) |
| PUT/PATCH | `/reminders/settings` | `enabled`, `reviewTime`, `timezone` |

## Response format

Success:

```json
{ "success": true, "data": { }, "message": "optional" }
```

Error:

```json
{
  "success": false,
  "error": { "code": "CODE", "message": "...", "details": [] },
  "requestId": "uuid"
}
```

## Further reading

- `server/docs/DOCUMENT_UPLOAD.md`
- `server/docs/AI_EXTRACTION.md`
- `server/docs/CHATBOT.md`
- `server/docs/REMINDERS_AND_PREFERENCES.md`
