-- 013_restrict_ship_officer_study_read_access.sql
-- LMPT2 SSCS
-- Restrict Ship Officer study reads to vessels for which the current user has
-- an approved vessel_access record. Vessel master rows remain visible to all
-- approved users so Ship Officers can still discover vessels and request access.
--
-- Prerequisite: 008_vessel_access_handover.sql

begin;

-- Parent-study read check used by study_sections, documents and Storage RLS.
-- Terminal Officers and Viewers retain their existing approved-account read
-- behaviour. Administrators retain full read access. Ship Officers must have
-- approved vessel access for the study's vessel.
create or replace function public.can_read_study(target_study_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.sscs_studies s
    where s.id = target_study_id
      and (
        public.current_user_is_admin()
        or (
          public.current_user_is_approved()
          and (
            public.current_user_role() in ('terminal_officer', 'viewer')
            or (
              public.current_user_role() = 'ship_officer'
              and public.current_user_has_vessel_access(s.vessel_id)
            )
          )
        )
      )
  );
$$;

revoke all on function public.can_read_study(text) from public;
grant execute on function public.can_read_study(text) to authenticated;

-- Study header rows need the same restriction directly because fetchStudies()
-- selects sscs_studies before loading study_sections.
drop policy if exists studies_select on public.sscs_studies;
create policy studies_select on public.sscs_studies
for select to authenticated
using (
  public.current_user_is_admin()
  or (
    public.current_user_is_approved()
    and (
      public.current_user_role() in ('terminal_officer', 'viewer')
      or (
        public.current_user_role() = 'ship_officer'
        and public.current_user_has_vessel_access(vessel_id)
      )
    )
  )
);

-- No change to vessels_select: approved users can still see the Vessel Database
-- and use the existing vessel_access request/approval workflow.
-- Existing study_sections/documents/storage SELECT policies already call
-- public.can_read_study(), so replacing that function secures those child data
-- paths without duplicating policies.

commit;
