# 🚩 राजमुद्रा गणेश उत्सव मंडळ (Rajmudra React PWA App)

Supabase-backed accounts, member donations, income/expenses, Aarti schedules, bank FD records, and PDF reports built with React, Vite, and a PWA shell.

## Key features

1. **Supabase is the source of truth**

   Ledger records and shared settings are read from and written to Supabase. The browser does not keep an offline ledger copy or replay browser-stored records back to the database.

2. **Realtime multi-device updates**

   Supabase Realtime notifies connected devices of changes. The app refreshes affected data instead of polling every few seconds.

3. **Safe PWA asset caching**

   The service worker caches only same-origin static application assets. Supabase and all cross-origin API requests always use the network, so an old cached response cannot restore a deleted ledger entry.

4. **Receipts and reports**

   Generate WhatsApp receipts and downloadable PDF financial reports from the current Supabase data.

## Supabase setup

1. Create a Supabase project and run [supabase_schema.sql](./supabase_schema.sql) in the SQL Editor.

   The migration is rerunnable and preserves existing ledger rows. It adds database-generated IDs, `updated_at` timestamps, fiscal-year indexes, `app_settings`, and Realtime publication membership for all ledger/settings tables.

2. Configure the client environment:

   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_AUTH_USERNAME_DOMAIN=login.rajmudra.invalid
   ```

3. For an existing installation, make sure all records that must be retained have reached Supabase before deploying the Supabase-only frontend. Do not automatically import old browser backups after the rollout; they may contain rows deleted by another device.

## Secure login: admin and view-only users

The app now uses a username-and-password screen backed by Supabase Auth, not a browser PIN. Supabase stores password hashes and the database enforces permissions:

- **Admin**: can create, edit, import, and delete.
- **Viewer**: can read data only. The interface hides editing actions and Row Level Security blocks writes even if someone bypasses the interface.

Before releasing the Auth-enabled build:

1. Choose an internal login domain and set the same value as `VITE_AUTH_USERNAME_DOMAIN` (for example `login.rajmudra.invalid`). In Supabase Dashboard, open **Authentication → Users** and create the users as `admin@login.rajmudra.invalid` and `viewer@login.rajmudra.invalid`. The app shows only `admin` and `viewer`; users never type the technical email. Confirm/auto-confirm the accounts while creating them. Use a strong password for the administrator. The viewer may use a simple PIN-style password only if it is accepted by your project's password policy; a longer numeric password is safer than `1234` or `0000`.
2. Open [supabase_auth_rls.sql](./supabase_auth_rls.sql) in Supabase SQL Editor and run it. It removes anonymous database access and creates the `user_roles` table and RLS policies.
3. Assign the two roles with the two commented `INSERT` statements at the bottom of that SQL file, replacing the sample email addresses with the two internal Auth addresses. Confirm that one row is `admin` and the other is `viewer`.
4. Deploy this Auth-enabled frontend immediately after the SQL policy change. Existing browser-PIN sessions will deliberately return to the login screen once; after a successful Supabase login, refreshes keep the user signed in.
5. Test both accounts in a private/incognito window. Verify the viewer cannot see edit/delete/import controls and that an admin can make one harmless test change.

The login page remembers only the last username on that device, so the user normally enters only their password. It never stores the password, role, ledger data, or Supabase service key in browser storage.

## Run locally

```bash
cd /home/sandip.pujari@domain.chitaledairy.co.in/Desktop/Sp/Pratice/rajmudra-app
npm install
npm run dev
```

Open the local URL printed by Vite in your browser or phone.
