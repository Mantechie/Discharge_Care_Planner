# DischargeCare — Security Checklist

Use before demo or production deployment. Not a certification.

## Authentication & sessions

- [ ] `JWT_SECRET` is a long random value (not the `.env.example` placeholder)
- [ ] `NODE_ENV=production` in production
- [ ] Refresh tokens are HTTP-only cookies; CSRF on refresh/logout
- [ ] Passwords stored as bcrypt hashes only (`passwordHash` never returned)
- [ ] Logout revokes refresh token family

## Authorization

- [ ] All private routes use `authenticate` middleware
- [ ] Queries scoped by `userId` from JWT, not request body
- [ ] Cross-user access returns 404/403 without leaking existence of other users' data
- [ ] Document file download requires ownership

## Input & API

- [ ] Joi (or Mongoose) validation on bodies and query params
- [ ] JSON body size limit configured (`JSON_BODY_LIMIT`)
- [ ] Helmet enabled (`server/src/app.js`)
- [ ] CORS `CLIENT_URL` lists only trusted origins
- [ ] Rate limits: auth, upload, extraction, chat

## Uploads & storage

- [ ] `MAX_FILE_SIZE_MB` enforced (default 10 MB)
- [ ] Magic-byte validation (`fileValidation.js`)
- [ ] `UPLOAD_DIR` outside web root; not world-readable
- [ ] Filenames sanitized; no path traversal
- [ ] Deleted documents remove storage when possible

## Secrets & AI

- [ ] `.env` not committed (see `server/.gitignore`)
- [ ] `AI_PROVIDER=gemini` (or supported live provider) in production — **not** `mock`
- [ ] `ALLOW_TEST_EXTRACTION_FIXTURE=false` and `ALLOW_TEST_CHAT_FIXTURE=false` in production
- [ ] `AI_API_KEY` set when using Gemini
- [ ] API keys only in environment variables

## Logging & privacy

- [ ] Request logger logs method, path, status — not bodies or tokens
- [ ] Error handler does not return stack traces in production
- [ ] Chat/document text not logged at info level

## Medical safety (operational)

- [ ] Staff trained: caregiver review ≠ doctor approval
- [ ] Synthetic/de-identified data only in test environments
- [ ] Chatbot answers are document-grounded, not universal medical advice

## Health checks

- [ ] `GET /api/v1/health` — process up
- [ ] `GET /api/v1/health/ready` — MongoDB connected (503 if not)

## Regression

- [ ] `cd server; npm test` — all tests pass
