-- Run AFTER you register the account that should become the first administrator.
-- Replace the email below with your real admin email.
-- This is intentionally separate from the main migration so no admin email is hard-coded.

update public.profiles
set
  is_admin = true,
  account_status = 'approved',
  role = coalesce(role, 'terminal_officer'),
  updated_at = now()
where lower(email) = lower('PAPAWICH.P@PTTLNG.COM');

-- Verify:
select id, full_name, email, role, account_status, is_admin
from public.profiles
where lower(email) = lower('PAPAWICH.P@PTTLNG.COM');
