# ForeMan mobile app

The ForeMan app, built from the design in `docs/04-design-system.md`. Runs on Android, iPhone and the web. Data lives in Supabase (see `../../supabase/README.md`) and on the phone, so it works without signal and sends when the network is back.

## Run it

You need Node 20 or newer. Create `.env` in this folder with your Supabase Project URL and anon key:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then:

```bash
npm install
npm run web
```

That opens the app in a browser at http://localhost:8081, shown at phone width.

To run it on your Android phone:

```bash
npx expo start
```

Install **Expo Go** from the Play Store, then scan the QR code in the terminal. The phone and the computer must be on the same Wi-Fi. If Expo Go says the project is not compatible with your version, update Expo Go first.

## What works

| Screen | What you can do |
|---|---|
| Login | Email and password. A new account sets up the company, or joins one if the owner added that email |
| Home | Workers present today on the current site, all sections, the mic |
| Sites | Switch site (also by tapping the site chip), add sites |
| Attendance | Add workers, mark Present, Half or Absent, All present, Save |
| Voice | Speak or type in Hindi, Hinglish or English, check, then save |
| Materials | Add materials with opening stock, stock in and out, low and out of stock pills |
| Bills | Tax invoice, plain bill or RA bill with your own items, share on WhatsApp, mark sent and paid |
| Company and team | Company details, GSTIN, UPI ID, add or remove project managers, log out |

The sync chip shows "All saved", "Sending · N" or "Saved on phone · N". Tap it to send now.

## Not built yet

Wages and advances, expenses and diary, photos with GPS, PDF export, UPI QR, Hindi strings, owner dashboard, per-site access for project managers.

## Code map

```
src/
  app/            Screens. Each file is a route (Expo Router).
  components/     Icon set and shared UI (buttons, pills, cards)
  data/           Store, offline queue and sync (sync.ts), types
  lib/            Supabase client, money and dates, billing math, voice
  theme/          Design tokens from docs/04-design-system.md
```

## Checks

```bash
npx tsc --noEmit
npx eslint src
```
