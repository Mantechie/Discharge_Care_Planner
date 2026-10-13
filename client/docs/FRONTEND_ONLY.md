# Frontend-only mode (no database)

With **`VITE_USE_LOCAL_DATA=true`** (default in `client/.env`):

- No MongoDB, no `server/` process required for normal use.
- Uploads, care plan, tasks, follow-ups, and chat are kept **only in RAM** for this browser tab.
- **Nothing** is written to `localStorage`, `sessionStorage`, or IndexedDB (language preference is also session memory only).
- Refreshing the page clears all medical data.

## Limits

| Feature | Local mode |
|--------|------------|
| PDF / image text extraction | Not available — use a `.txt` file or turn on the server |
| AI chat answers | Placeholder message only |
| Multi-device / backup | Not supported |

## Use the real backend

```env
VITE_USE_LOCAL_DATA=false
VITE_API_BASE_URL=http://localhost:5000
```

Run MongoDB and `npm run dev` in `server/` as documented in `DEPLOYMENT_GUIDE.md`.
