-- LMPT2 SSCS: no-email, administrator-approved password reset requests
-- Run once in Supabase SQL Editor before deploying the password-reset Edge Function.

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists password_reset_requests_status_idx
  on public.password_reset_requests(status, requested_at desc);
create index if not exists password_reset_requests_user_idx
  on public.password_reset_requests(user_id, requested_at desc);
create index if not exists password_reset_requests_email_idx
  on public.password_reset_requests(lower(email), requested_at desc);

alter table public.password_reset_requests enable row level security;

-- Only administrators can see reset requests in the dashboard.
drop policy if exists password_reset_requests_admin_select on public.password_reset_requests;
create policy password_reset_requests_admin_select
on public.password_reset_requests
for select
to authenticated
using (public.current_user_is_admin());

-- Only administrators can approve or reject requests from the browser.
drop policy if exists password_reset_requests_admin_update on public.password_reset_requests;
create policy password_reset_requests_admin_update
on public.password_reset_requests
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- No anonymous/authenticated INSERT or DELETE policies are intentionally created.
-- Creation/completion is handled only by the password-reset Edge Function using
-- the server-side service-role key.
