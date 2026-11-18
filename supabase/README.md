# ForeMan on Supabase

The live backend: database, logins and the hosted voice function. Run every command from the `ForeMan` folder (the one that holds `supabase/`).

## What is here

| Path | What it does |
|---|---|
| `migrations/20261118000000_init.sql` | Tables, access rules (row-level security), company sign-up and invites |
| `functions/voice-parse/` | Voice to entry with Gemini. Only logged-in company members can call it |
| `functions/voice-parse/core.ts` | Voice rules, shared with `apps/api` so its tests cover them |

## One-time setup

1. **Logins without email.** ForeMan uses email and password. In the Supabase dashboard open **Authentication → Sign In / Providers → Email** and turn **off** "Confirm email". Then nobody needs to receive an email to start, and no SMTP setup is needed.

2. **Link the CLI** (it opens the browser so you can log in yourself):

   ```powershell
   npx supabase login
   ```

   ```powershell
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

   The project ref is the part before `.supabase.co` in your Project URL. It asks for the database password you chose.

3. **Create the tables:**

   ```powershell
   npx supabase db push
   ```

4. **Voice.** Put the Gemini key in as a secret, then deploy the function. Type the key yourself; never paste it in chat or in the app.

   ```powershell
   npx supabase secrets set GEMINI_API_KEY=your-key-here
   ```

   ```powershell
   npx supabase functions deploy voice-parse
   ```

## Who sees what

- One login belongs to one company. The first person to log in with a new email sets up a company and becomes the **owner**.
- The owner adds **project managers** by email in *Company and team*. They tap **New account** with that email and join the company.
- Everyone in a company sees all its sites. Limiting a project manager to their own sites comes later.
- Nobody can delete stock entries. Stock is a list of moves (in / out), so a retry on bad network never counts twice.

## Limits to know

- No "forgot password" in the app yet. The owner resets a password in **Authentication → Users** (pick the user, then send a reset or set a new one).
- Phone OTP replaces email and password once SMS DLT registration is done (see `docs/03-tech-stack.md`).
