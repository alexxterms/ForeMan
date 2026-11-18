# ForeMan API: local voice server

**The app now uses the hosted Supabase function (`supabase/functions/voice-parse`).** This server stays for local testing and for the tests of the shared voice rules in `supabase/functions/voice-parse/core.ts`.

A small server that turns speech into entries using Google Gemini. The app records audio and sends it here. This server holds the Gemini key, so the key never goes into the app.

```
App (microphone)  ->  POST /voice/parse  ->  Gemini  ->  checked entry  ->  App confirm screen
```

## Set up

1. Get a Gemini API key from Google AI Studio (https://aistudio.google.com/apikey).
2. In this folder, copy `.env.example` to `.env` and paste the key after `GEMINI_API_KEY=`.
3. Install and start:

```bash
npm install
npm run dev
```

You should see `Voice ready with model gemini-3.5-flash-lite`. If it says `Voice NOT ready`, the key is missing.

Never commit `.env`. It is already in `.gitignore`. Do not paste the key into chat or into the app.

## Use it from the app

Start the app in `apps/mobile` with `npm run dev`. Open Speak and tap **Tap to speak**.

- **Browser:** the app finds the server at http://localhost:8787.
- **Phone with Expo Go:** the app uses the same computer that serves the app, on port 8787. The phone and the computer must be on the same Wi-Fi. If Windows asks about the firewall, allow Node.js on private networks.
- **Anything else:** set `EXPO_PUBLIC_API_URL=http://<computer-ip>:8787` in `apps/mobile/.env`.

The Speak screen shows whether the server is ready, missing the key, or not reachable.

## What you can say

| Say | Result |
|---|---|
| "Ramesh aaj 8 ghante" | Ramesh present, 8 hours |
| "Sunil half day" | Sunil half day |
| "Raju absent" | Raju absent |
| "50 bori cement aaya" | Stock in: cement 50 bags |
| "20 bori cement lagi" | Stock out: cement 20 bags |
| "2 ton sand arrived" | Stock in: sand 2 tons |

The model only picks from the workers and materials the app sends. It cannot invent a name or an id. Anything that does not match is refused with a short message and nothing is saved. The app always asks you to confirm before it saves.

## Endpoints

- `GET /health` returns `{ ok, voiceReady, model }`.
- `POST /voice/parse` takes `{ audio?: { data, mimeType }, text?, context }` and returns `{ transcript, draft, message }`. `audio.data` is base64. `context` lists the workers and materials.

## Settings (`.env`)

| Name | Default | Meaning |
|---|---|---|
| `GEMINI_API_KEY` | none | Required for voice |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Model used for audio and text |
| `PORT` | `8787` | Server port |
| `DEMO_TOKEN` | none | If set, the app must send the same value as `EXPO_PUBLIC_DEMO_TOKEN`. Anything in `EXPO_PUBLIC_` is visible inside the app, so this only keeps casual visitors out of a demo |

## Checks

```bash
npm test
npm run typecheck
```

The tests use a fake model. They check the entry rules, the audio format handling, the token check, and the error messages. They do not call Gemini, so they cannot tell you if the key works.

## Limits of demo 1

- No login. Anyone who can reach the server can use your Gemini key's quota. Keep it on your own network, or set `DEMO_TOKEN`.
- Recordings are not stored. Audio is sent to Gemini and discarded.
- Audio goes to Google. Tell the workers and the contractor before real use (see the data protection note in `docs/03-tech-stack.md`).
