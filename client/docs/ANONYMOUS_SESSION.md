# Anonymous session lifecycle (MVP)

This documents the **actual** backend and frontend behavior as implemented. It is not a security audit.

## Session creation

1. On first protected API call (e.g. upload), the client calls `POST /api/v1/auth/anonymous-session` with no body.
2. The server creates an anonymous `User` (`isAnonymous: true`) and returns a JWT `accessToken` in the JSON body (see `buildAuthResponse` in `server/src/services/auth.service.js`).
3. Default anonymous token lifetime is configured by `anonymousJwtExpiresIn` (e.g. 12h in `server/src/config/env.js`).

## What authorizes document access

- Every document, care plan, task, follow-up, and chat route uses the `authenticate` middleware.
- The client sends `Authorization: Bearer <accessToken>`.
- **Document IDs alone do not authorize** — integration tests in `server/tests/integration/anonymousSession.test.js` verify cross-session access is denied.

## Frontend token storage

- **Local mode (`VITE_USE_LOCAL_DATA=true`, default):** no server JWT; a placeholder token and all documents live in `client/src/localSession/localDataStore.js` (RAM only).
- **Server mode:** JWT is held **in memory only** (`accessTokenStore.js`). No `localStorage` / `sessionStorage` for medical data or language.

## Session expiration

- When the API returns `401` with code `UNAUTHORIZED`, `apiFetch` clears the token and calls `notifySessionExpired()`.
- `HomePage` registers a listener that stops text-to-speech, clears the upload workspace, and shows a translated session-expired message.
- Child hooks abort in-flight requests on document change and clear document-scoped state on `401`.

## Document replacement

- Choosing a new file while a document is active opens a confirm dialog, then `DELETE /api/v1/documents/:id` (when possible), clears workspace state, and starts a new upload.
- Polling and speech are stopped; chat/review/dashboard hooks reset when `documentId` changes.

## Deletion and retention

- Replacing a document triggers server-side deletion of the prior document for that user when `DELETE` succeeds.
- Chat history is scoped per document on the server; clearing chat calls `DELETE /api/v1/chat/history?documentId=`.
- **Do not claim** full file or database erasure unless the backend confirms it — MongoDB records may remain per server retention/cleanup jobs not described here.

## Gaps / production notes

- Anonymous MVP uses **Bearer tokens in memory**, not HttpOnly session cookies. Refresh tokens and CSRF-protected cookie sessions apply to registered users, not anonymous guests.
- Full page reload requires a new anonymous session and re-upload.
- Production should use HTTPS so tokens and uploads are not exposed on the wire.
