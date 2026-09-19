# LNG Vessel Website — Supabase Cloud Edition

This bundle is based on the exported Figma Make project and has been extended with a Supabase backend for authentication, persistent vessel/SSCS data, Row Level Security, and private document storage.

## Setup

**Thai step-by-step instructions:** see [`SUPABASE_SETUP_TH.md`](./SUPABASE_SETUP_TH.md).

Quick order:

1. Run `supabase/001_initial_schema.sql` in the Supabase SQL Editor.
2. Run `supabase/002_seed_vessels.sql`.
3. Copy `.env.example` to `.env.local` and fill the Supabase URL + Publishable/anon key.
4. Register the first admin account, then run `supabase/003_bootstrap_admin.sql` after replacing the placeholder email.
5. Install and run:

```bash
npm install
npm run dev
```

Without Supabase environment variables the project falls back to the original local demo mode for UI preview only.
