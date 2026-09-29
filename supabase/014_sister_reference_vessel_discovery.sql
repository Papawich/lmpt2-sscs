-- 014_sister_reference_vessel_discovery.sql
-- Allow approved users to discover which vessels have an Approved SSCS study
-- for the Add Vessel -> Sister Ship reference selector without granting access
-- to the referenced vessel's SSCS study content.

begin;

create or replace function public.list_approved_sister_reference_vessels()
returns table (vessel_id bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct s.vessel_id
  from public.sscs_studies s
  where s.status = 'approved'
    and public.current_user_is_approved()
  order by s.vessel_id;
$$;

revoke all on function public.list_approved_sister_reference_vessels() from public;
grant execute on function public.list_approved_sister_reference_vessels() to authenticated;

commit;
