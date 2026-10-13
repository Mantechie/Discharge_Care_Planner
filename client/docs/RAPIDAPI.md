# RapidAPI (TTS + Gemini)

Keys must live **only** in `server/.env` as `RAPIDAPI_KEY`. Do not paste keys into chat, git, or `VITE_*` variables.

## Text-to-speech (your OpenAI TTS RapidAPI)

Server: `POST /api/v1/tts/speak` (authenticated) → proxies to `open-ai-text-to-speech1.p.rapidapi.com`.

Client:

```env
VITE_USE_LOCAL_DATA=false
VITE_TTS_PROVIDER=rapidapi
```

## Chat / extraction (Gemini via RapidAPI)

Server:

```env
RAPIDAPI_KEY=your_rapidapi_key
AI_PROVIDER=rapidapi
```

Uses `gemini-api3.p.rapidapi.com/generate` with the same discharge-safety prompts as the native Gemini provider. Responses must be valid JSON for chat and extraction.

## Security

If a key was shared publicly, **rotate it** in the RapidAPI dashboard immediately.
