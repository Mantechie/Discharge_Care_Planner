# Phase 8 — Repository Audit Report

**Project:** DischargeCare (`H:\DischargeCarePlanner`)  
**Audit date:** 2026-10-13  
**Note:** `BACKEND_DEVELOPMENT_SPEC.md` and Phase 1–7 markdown specs were **not present** in the repository at audit time. Findings are based on source code and executed tests.

## Summary

| Area | Status | Evidence |
|------|--------|----------|
| Backend API (Phases 1–7) | **Implemented** | Routes in `server/src/routes/*`, services, 93 automated tests passing |
| React client | **Partial** | `client/` health check only; upload/care plan/chat UI not wired |
| MongoDB models | **Implemented** | `server/src/models/*` |
| Auth + refresh rotation | **Implemented** | `auth.test.js`, `auth.service.js`, `RefreshSession` |
| Ownership / authorization | **Implemented** | `authorization.test.js`, `phase8.security.test.js` |
| Document upload + storage | **Implemented** | `documents.test.js`, `storage.service.js` |
| PDF + OCR | **Implemented** | `pdf.service.js`, `ocr.service.js` (provider configurable) |
| AI extraction + validation | **Implemented** | `extraction.test.js`, `validation.service.test.js` |
| Care plans / tasks / follow-ups | **Implemented** | `phase5.test.js` |
| Chatbot (grounded) | **Implemented** | `chat.test.js`, `retrieval.service.js` |
| Preferences + reminders | **Implemented** | `phase7.test.js`, `reminderTemplates.test.js` |
| Production env guards | **Implemented (Phase 8)** | `env.js` rejects mock AI / test fixtures in production |
| DB readiness probe | **Implemented (Phase 8)** | `GET /api/v1/health/ready` |
| Extraction rate limiting | **Implemented (Phase 8)** | `createExtractionRateLimiter` on extract routes |
| Scheduled reminder delivery | **Missing** | No cron/worker; in-app only per API `delivery` metadata |
| Web push / background notifications | **Not implemented** | Explicitly `false` in reminder delivery capabilities |
| Browser E2E automation | **Not run** | No Playwright/Cypress suite in repo |
| Clinical / regulatory compliance | **Not claimed** | Caregiver review ≠ clinical approval in API responses |

## Component detail

### Authentication (`server/src/services/auth.service.js`)
- **Status:** Implemented  
- **Evidence:** bcrypt hashing (`auth.test.js`), JWT access + refresh cookies, rotation and reuse detection  
- **Risks:** Ensure strong `JWT_SECRET` in production (validated by `loadEnv`)  
- **Action:** None critical

### Authorization (`ownership.service.js`, route handlers)
- **Status:** Implemented  
- **Evidence:** Cross-user 404 for documents, care plans, tasks, follow-ups, chat, reminders (`authorization.test.js`, `phase8.security.test.js`)  
- **Action:** Continue using owner-scoped queries for new endpoints

### Document pipeline
- **Status:** Implemented  
- **Evidence:** Signature validation, size limits, private `storageKey`, owned download (`documents.test.js`)  
- **Risks:** `UPLOAD_DIR` must be secured on host; not served as static public folder  
- **Action:** Document in `DEPLOYMENT_GUIDE.md`

### Medical extraction safety
- **Status:** Implemented  
- **Evidence:** `validation.service.test.js`, extraction integration tests, no frequency→clock-time in tasks (`phase5.test.js`)  
- **Action:** Re-run tests when changing validation rules

### Chat grounding
- **Status:** Implemented  
- **Evidence:** `chat.test.js`, citation verification (`retrieval.service.test.js`, `sourceReferences.test.js`)  
- **Blocker for production AI:** Requires `AI_PROVIDER=gemini` + `AI_API_KEY`; mock only with explicit test flags

### Frontend
- **Status:** Partial  
- **Evidence:** `client/src/App.jsx` — placeholder cards, no API integration for Phases 3–7  
- **Action:** Wire client in a future phase; E2E remains unverified

## Defects fixed in Phase 8

1. Invalid document IDs could cause Mongoose cast errors (500) → now return **404** (`document.service.js`).  
2. Production could start with `AI_PROVIDER=mock` → **blocked** at startup (`env.js`).  
3. No extraction rate limit → **added** (`EXTRACTION_RATE_LIMIT_MAX`).  
4. Liveness vs readiness → **`/health/ready`** added for MongoDB state.

## Recommended next actions

1. Integrate React client with existing APIs for demo workflow.  
2. Add optional job runner for in-app reminder scheduling (still not push).  
3. Run manual UAT with synthetic PDFs before any external demo.  
4. Do **not** deploy to production without real AI credentials and security review of host storage.
