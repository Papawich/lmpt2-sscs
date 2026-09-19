# Supabase integration changes

- Added `@supabase/supabase-js` dependency.
- Added `src/app/supabaseClient.ts` for browser-safe Supabase configuration.
- Added `src/app/backendService.ts` for Auth, profiles, vessels, studies, JSONB sections, and Storage.
- Updated `App.tsx` to restore cloud sessions, use Supabase Auth, hydrate cloud data, persist study edits, save new vessels, and administer account approvals.
- Preserved a local demo fallback when Supabase environment variables are absent.
- Updated Required Documents so cloud mode stores actual files in private Supabase Storage rather than embedding Data URLs in the database.
- Added SQL migrations for schema, RLS, storage policies, auditing, and the 58 original vessel seed records.
- Kept EmailJS workflow notifications. EmailJS settings can now be overridden with environment variables; the original configured values remain as fallback for compatibility with this export.
- Added optional `VITE_ADMIN_NOTIFICATION_EMAILS` for new-registration alerts in cloud mode.
