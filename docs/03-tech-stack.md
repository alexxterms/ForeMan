# ForeMan: tech stack

**Status: approved by the owner.** Next: create the Expo app and the Supabase project in the Mumbai region.

## Recommendation in one table

| Layer | Pick | Why |
|---|---|---|
| Mobile app | **React Native with Expo**, TypeScript, Android first | Fast to build, good Devanagari text rendering, camera and GPS modules, small team can maintain it |
| Local database (offline) | **SQLite** (`expo-sqlite`) | Real database on the phone, handles thousands of rows, fast on 2 GB RAM |
| Sync | **PowerSync** with Postgres | Handles the hard part: queued writes, retries, no duplicates, conflict rules. Alternative: a custom outbox (see below) |
| Backend database | **PostgreSQL** via **Supabase**, Mumbai region | Row-level security for "project manager sees only their sites", data stays in India |
| Auth | Supabase Auth with **phone OTP** | Project managers and owner log in once, then use a 4-digit PIN on the shared phone |
| File storage | Supabase Storage (Mumbai) | Photos, challans, invoice PDFs |
| Backend logic | **TypeScript** Edge Functions and a small Node service | One language across app, server, and shared rules |
| Voice to text | **Sarvam AI** or **Google Cloud Speech-to-Text** (hi-IN, en-IN). Pick after a bake-off | Indian-language accuracy matters most. Both support Hindi and Hinglish; Sarvam is built for Indian languages |
| Voice to entry | **Claude Haiku 5.5** (`claude-haiku-5-5`) with a fixed JSON schema | Cheap, fast, turns "Ramesh aaj 8 ghante" into a structured entry, then the app asks for confirmation |
| Invoices and RA bills | **@react-pdf/renderer** on the server, with Noto Sans Devanagari embedded | Real PDF output, no headless browser to run |
| Excel export | **exceljs** | Pure JavaScript, no Office install needed |
| i18n | **i18next** with JSON string files per language | Adding Marathi, Tamil, etc. means adding one file |
| SMS OTP | **MSG91** or Gupshup | Indian routes; **DLT template registration is mandatory** (see risks) |
| Push reminders | Firebase Cloud Messaging | Free, works on budget Android |
| Errors and crashes | Sentry (free tier) | Catches crashes from real devices |
| Monorepo | pnpm workspaces, Turborepo | Shared rules, schemas and strings between app and server |
| Testing | Vitest (logic), Jest (app), Maestro (end-to-end on a 2 GB Android emulator) | Maestro runs the attendance flow like a user |

## What Expo is

Expo is a set of tools built on React Native. React Native lets us write one app in TypeScript for Android (and later iPhone). Expo adds three things we need:

- A ready project setup, so we don't configure Android Studio before writing the first screen.
- A cloud build service that produces the Android app file, so we don't need a powerful build machine.
- Over-the-air updates, so small fixes reach phones without a Play Store release.

## Why this and not the alternatives

**Mobile framework**
- **Flutter:** Equally good. Pick it if the team already knows Dart. We do not, so React Native is the faster start.
- **Native Kotlin:** Best speed and smallest app. Slower to build and to change, Android-only code. Revisit only if the app is too slow on real devices after launch.
- **PWA (website installed to home screen):** No store, smallest download, zero install friction. But background sync on Android Chrome is unreliable when the app is closed, and offline storage limits are tighter. This is the risk for "no lost entries". Good fallback if app store approval or install size becomes a blocker.

**Offline sync**
- **PowerSync (recommended):** Mature, works with Supabase Postgres, has a free tier for development. Cost grows with users; check current pricing before committing.
- **Custom outbox (cheaper, more work):** Each entry gets a client-made UUID. Writes go into a local `outbox` table. A background job uploads them, and the server uses `INSERT ... ON CONFLICT (id) DO NOTHING`, so a retry never duplicates. Conflicts are rare because entries are mostly append-only. Choose this if the PowerSync cost is too high for the first 50 customers.
- **WatermelonDB, RxDB:** Work, but more setup and less used with Postgres backends.

**Backend**
- **Supabase (recommended):** Postgres, auth, storage and functions in one place. Mumbai region keeps data in India. Owner and project manager permissions map onto row-level security.
- **Own Node server with Postgres:** More control, more to run. Choose later if the team grows.
- **Firebase:** Simple, but Firestore's data model is awkward for ledgers and reporting. Not recommended.

## What the app does on the phone

- Login: phone OTP once. Then a 4-digit PIN for quick switching on a shared phone.
- Every entry is saved to SQLite first, with a status: `saved`, `waiting to send`, `sent`, `needs review`.
- Photos are compressed to under 300 KB on the phone before saving. GPS and device time are stored with each photo. Server time is added when it syncs.
- The app stays under 40 MB installed. It uses Hermes, lazy-loads the voice and PDF screens, and uses a virtualised list (FlashList) for worker and material lists.
- Strings come from the i18n files. Numbers use `Intl.NumberFormat('en-IN')`, which gives lakh grouping (₹12,50,000). Dates use DD/MM/YYYY.

## Voice pipeline

**Demo 1 uses Gemini** (`gemini-3.5-flash-lite`) for both listening and understanding, through the small server in `apps/api`. One call turns audio into a checked entry. The vendor bake-off below still applies before a real launch, with Gemini as one of the contenders.

1. Phone records audio (up to 30 seconds per clip, compressed to Opus).
2. Audio goes to the speech-to-text API. Text comes back.
3. Claude Haiku 5.5 gets the text and the lists of workers, sites and materials for that owner. It returns JSON: `{ type, worker_id, site_id, hours, material, quantity, unit, confidence }`.
4. The app checks each ID exists and each number is sensible, then shows the confirm screen.
5. The user taps "save". Nothing is saved from voice without that tap.

Offline: audio is saved to the phone with status `waiting for network`, then steps 2 to 5 run when signal returns.

Cost: speech and parsing cost fractions of a rupee per entry. Check current vendor pricing with a real month of sample entries.

## Things to decide or verify early

1. **Speech vendor bake-off.** Record 50 real project manager clips on a budget phone at a site (fans, cement mixers, traffic). Run them through Sarvam and Google. Score word error rate and entry accuracy. Two days of work, and it decides the vendor.
2. **DLT registration for SMS.** India requires SMS senders and templates to be registered on the DLT platform before sending. Registration takes days to a few weeks. Start it on day one, or OTP login will not work at launch.
3. **Data protection.** The Digital Personal Data Protection Act, 2023 applies to worker names, phone numbers and photos. We need a privacy notice in Hindi, consent from project managers, and a data export and delete path. We do not collect Aadhaar in v1.
4. **WhatsApp Business API.** Needs Meta business verification and approved message templates. Start the application when we start the v1.1 build, not now. v1 uses the Android share sheet.
5. **Tally format.** Get a sample Tally import file from the user's CA before writing the export.
6. **GST invoice format.** Confirm with a CA which invoice fields and tax rates apply to their contract type.

## Cost picture (rough, verify before committing)

- Supabase Pro: about USD 25 per month base, plus usage
- PowerSync: free to start, then per-user pricing. Verify.
- SMS OTP: a fraction of a rupee per message on Indian routes
- Speech and Claude parsing: fractions of a rupee per entry

At 20 contractors with 5 project managers each, a rough monthly infrastructure bill should stay in the low thousands of rupees. The largest unknown is the speech vendor and sync pricing. The bake-off and a PowerSync quote will settle both.

## Repo layout (proposed)

```
ForeMan/
  apps/
    mobile/        Expo app (project manager and owner, Android first)
    web/           Owner and accountant web views (later)
  packages/
    domain/        Wage, advance, GST and RA bill rules. Pure TypeScript, tested.
    schemas/       Zod schemas shared by app and server
    i18n/          en.json, hi.json (add mr.json, ta.json later)
    voice/         Speech vendor interface, voice-to-entry parser
  server/
    functions/     Supabase Edge Functions (sync, invoice PDF)
    db/            SQL migrations, row-level security policies
  docs/            Scope, design, this file
  design-options/  Mockups (keep until a direction is chosen, then move to design/)
```

## Next steps once the stack is approved

1. Set up the monorepo and empty Expo app that boots on a 2 GB emulator
2. Write the database schema and row-level security tests
3. Build the attendance flow end to end (offline, sync, no duplicates) before anything else
4. Start the DLT and speech bake-off in parallel with step 3
