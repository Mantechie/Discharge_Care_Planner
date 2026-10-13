# DischargeCare — Deployment Guide

## Prerequisites

- Node.js 20+ (LTS recommended)
- MongoDB 6+ (Atlas or self-hosted)
- Windows PowerShell or bash for operations

## Repository layout

- `server/` — Express API (`npm run dev` / `npm start`)
- `client/` — React + Vite (optional for API-only deployment)

## Installation (API)

```powershell
cd H:\DischargeCarePlanner\server
npm install
copy .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, AI_PROVIDER, AI_API_KEY, CLIENT_URL
npm run dev
```

Production start:

```powershell
$env:NODE_ENV="production"
npm start
```

## Environment variables

See `server/.env.example`. Critical production values:

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | Strong random secret |
| `CLIENT_URL` | Frontend origin(s), comma-separated for CORS |
| `AI_PROVIDER` | `gemini` (not `mock`) |
| `AI_API_KEY` | Provider key |
| `UPLOAD_DIR` | Private directory for PDFs/images |
| `MAX_FILE_SIZE_MB` | Default 10 |
| `OCR_PROVIDER` | `none`, or configured OCR service |

Production startup **fails** if: missing `MONGODB_URI`, weak/placeholder `JWT_SECRET`, `AI_PROVIDER=mock`, or test AI fixture flags enabled.

## Database

- Mongoose models create indexes on first use; no separate migration tool in repo.
- Use a **dedicated** database per environment; tests use `TEST_MONGODB_URI` or in-memory server.
- Back up MongoDB and `UPLOAD_DIR` on a schedule appropriate to your deployment.

## File storage

- Default `./storage` relative to server cwd.
- Ensure the service account can read/write; deny HTTP static mapping to this path.
- On document delete, API attempts storage cleanup (`document.service.js`).

## CORS

Set `CLIENT_URL` to your deployed frontend, e.g. `https://app.example.com`. Multiple origins: comma-separated list.

## Health checks

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/health/ready` (503 if MongoDB disconnected)

## AI provider

- Development/tests: `AI_PROVIDER=mock` with `ALLOW_TEST_EXTRACTION_FIXTURE=true` for fixture PDFs only.
- Production: `AI_PROVIDER=gemini` and valid `AI_API_KEY`.

## Logging

- Request line logging via `safeRequestLogger` (no auth headers).
- Unexpected errors in production log generic message + `requestId`.

## Testing before release

```powershell
cd H:\DischargeCarePlanner\server
npm test
```

See `PHASE_8_TEST_REPORT.md` for latest verified counts.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Server won't start | `loadEnv` error message; MongoDB reachable |
| 503 on extract/chat | AI credentials; provider name |
| 404 on documents | JWT user must own document |
| Upload 415 | File signature / type |
| CORS errors | `CLIENT_URL` matches browser origin |

## Known limitations

- No background job for daily reminders (client must poll or schedule locally while app open).
- No web push notification service.
- React UI not fully integrated with backend APIs.
- Not clinically validated; not HIPAA/GDPR certified by this documentation.

## Deployment checklist

1. Set production env vars and secrets  
2. Provision MongoDB + backups  
3. Secure `UPLOAD_DIR`  
4. Run `npm test` on release candidate  
5. Configure reverse proxy (TLS)  
6. Set `CLIENT_URL` and verify CORS  
7. Verify `/health/ready` after deploy  
8. Smoke-test auth, upload, extract with **synthetic** PDF only  
