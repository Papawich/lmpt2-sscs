-- LMPT2 SSCS Minor Change 1.2
-- Ship Officer acknowledgement after completing Terminal Officer feedback.
--
-- Purpose:
--   * Ship Officer can mark an OPEN feedback cycle as CORRECTED while the study
--     remains Submitted.
--   * The selected feedback sections are locked again immediately because
--     feedback-scoped RLS only permits editing while status = 'open'.
--   * The application then notifies the Terminal Officer currently In Charge.
--
-- Prerequisite: 009_minor_change_1_feedback_permissions.sql has been applied.

create or replace function public.ship_mark_feedback_corrected(target_study_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  study_vessel_id bigint;
  feedback_row jsonb;
  officer_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.current_user_is_approved()
     or public.current_user_role() <> 'ship_officer' then
    raise exception 'Only an approved Ship Officer may complete feedback corrections';
  end if;

  select s.vessel_id
    into study_vessel_id
  from public.sscs_studies s
  where s.id = target_study_id
    and s.status = 'submitted';

  if study_vessel_id is null then
    raise exception 'Submitted study not found';
  end if;

  if not public.current_user_has_vessel_access(study_vessel_id) then
    raise exception 'You do not have access to this vessel';
  end if;

  select ss.data
    into feedback_row
  from public.study_sections ss
  where ss.study_id = target_study_id
    and ss.section_key = 'terminal_feedback'
  for update;

  if feedback_row is null
     or coalesce(feedback_row->>'status', 'none') <> 'open' then
    raise exception 'There is no open feedback to complete';
  end if;

  select coalesce(nullif(p.full_name, ''), nullif(p.email, ''), 'Ship Officer')
    into officer_name
  from public.profiles p
  where p.id = auth.uid();

  feedback_row := feedback_row || jsonb_build_object(
    'status', 'corrected',
    'correctedById', auth.uid()::text,
    'correctedByName', coalesce(officer_name, 'Ship Officer'),
    'correctedAt', now()::text
  );

  update public.study_sections
  set data = feedback_row,
      updated_by = auth.uid(),
      updated_at = now()
  where study_id = target_study_id
    and section_key = 'terminal_feedback';

  return feedback_row;
end;
$$;

revoke all on function public.ship_mark_feedback_corrected(text) from public;
grant execute on function public.ship_mark_feedback_corrected(text) to authenticated;
