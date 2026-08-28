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
   ```

3. For an existing installation, make sure all records that must be retained have reached Supabase before deploying the Supabase-only frontend. Do not automatically import old browser backups after the rollout; they may contain rows deleted by another device.

4. The compatibility RLS policies in the schema permit anonymous access because the current app has not yet adopted Supabase Auth. Replace them with authenticated, organization-scoped policies before a public production deployment. Never store PINs, credentials, or other secrets in `app_settings`.

## Run locally

```bash
cd /home/sandip.pujari@domain.chitaledairy.co.in/Desktop/Sp/Pratice/rajmudra-app
npm install
npm run dev
```

Open the local URL printed by Vite in your browser or phone.
