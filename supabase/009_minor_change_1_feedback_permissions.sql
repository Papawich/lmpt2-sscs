-- LMPT2 SSCS Minor Change 1
-- Feedback-scoped corrections for a Submitted study.
--
-- Purpose:
--   * Terminal Officer can leave Feedback while the study remains Submitted.
--   * Ship Officer may correct ONLY the sections selected in that open feedback.
--   * Document writes are limited to the selected feedback area.
--   * This does not replace the formal Request Revision workflow.
--
-- Prerequisite: 008_vessel_access_handover.sql has been applied.

-- ---------------------------------------------------------------------------
-- Read the feedback scope stored by the application in study_sections.
-- These helper functions are SECURITY DEFINER so their RLS checks can safely
-- inspect the terminal_feedback row while evaluating other RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.ship_feedback_is_open(target_study_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.study_sections ss
    where ss.study_id = target_study_id
      and ss.section_key = 'terminal_feedback'
      and coalesce(ss.data->>'status', 'none') = 'open'
  );
$$;

create or replace function public.ship_feedback_allows_section(
  target_study_id text,
  target_section_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.study_sections ss
    cross join lateral jsonb_array_elements(coalesce(ss.data->'items', '[]'::jsonb)) as item
    cross join lateral jsonb_array_elements_text(coalesce(item->'sectionKeys', '[]'::jsonb)) as allowed(section_key)
    where ss.study_id = target_study_id
      and ss.section_key = 'terminal_feedback'
      and coalesce(ss.data->>'status', 'none') = 'open'
      and allowed.section_key = target_section_key
  );
$$;


create or replace function public.ship_feedback_has_part(
  target_study_id text,
  target_part_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.study_sections ss
    cross join lateral jsonb_array_elements(coalesce(ss.data->'items', '[]'::jsonb)) as item
    where ss.study_id = target_study_id
      and ss.section_key = 'terminal_feedback'
      and coalesce(ss.data->>'status', 'none') = 'open'
      and item->>'section' = target_part_name
  );
$$;

create or replace function public.ship_feedback_allows_core(target_study_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.ship_feedback_allows_section(target_study_id, '__core__');
$$;

-- Document permissions are deliberately narrower than general section editing.
-- Required Documents feedback may update any required-document upload.
-- Quality Assessment feedback may update only the two certificate-evidence files
-- introduced by Minor Change 1. Attachment feedback may update the vessel photo.
create or replace function public.ship_feedback_allows_document(
  target_study_id text,
  target_document_type text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.ship_feedback_is_open(target_study_id)
     and (
       public.ship_feedback_has_part(target_study_id, 'Required Documents')
       or (
         public.ship_feedback_has_part(target_study_id, 'Quality Assessment')
         and target_document_type in ('d_7_1', 'quality_ship_sanitation')
       )
       or (
         public.ship_feedback_has_part(target_study_id, 'Attachment')
         and target_document_type = 'vessel_photo'
       )
     );
$$;

revoke all on function public.ship_feedback_is_open(text) from public;
revoke all on function public.ship_feedback_allows_section(text, text) from public;
revoke all on function public.ship_feedback_has_part(text, text) from public;
revoke all on function public.ship_feedback_allows_core(text) from public;
revoke all on function public.ship_feedback_allows_document(text, text) from public;
grant execute on function public.ship_feedback_is_open(text) to authenticated;
grant execute on function public.ship_feedback_allows_section(text, text) to authenticated;
grant execute on function public.ship_feedback_has_part(text, text) to authenticated;
grant execute on function public.ship_feedback_allows_core(text) to authenticated;
grant execute on function public.ship_feedback_allows_document(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Section edit helper: normal Draft/Editing behaviour stays unchanged; Submitted
-- correction is allowed only for a section explicitly named in open feedback.
-- Terminal Officer/Admin retain their existing edit rights.
-- ---------------------------------------------------------------------------
create or replace function public.can_edit_study_section(
  target_study_id text,
  target_section_key text
)
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
      and public.current_user_is_approved()
      and (
        public.current_user_is_admin()
        or public.current_user_role() = 'terminal_officer'
        or (
          public.current_user_role() = 'ship_officer'
          and public.current_user_has_vessel_access(s.vessel_id)
          and (
            s.status in ('draft', 'editing')
            or (
              s.status = 'submitted'
              and public.ship_feedback_allows_section(s.id, target_section_key)
            )
          )
        )
      )
  );
$$;

create or replace function public.can_edit_study_document(
  target_study_id text,
  target_document_type text
)
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
      and public.current_user_is_approved()
      and (
        public.current_user_is_admin()
        or public.current_user_role() = 'terminal_officer'
        or (
          public.current_user_role() = 'ship_officer'
          and public.current_user_has_vessel_access(s.vessel_id)
          and (
            s.status in ('draft', 'editing')
            or (
              s.status = 'submitted'
              and public.ship_feedback_allows_document(s.id, target_document_type)
            )
          )
        )
      )
  );
$$;

revoke all on function public.can_edit_study_section(text, text) from public;
revoke all on function public.can_edit_study_document(text, text) from public;
grant execute on function public.can_edit_study_section(text, text) to authenticated;
grant execute on function public.can_edit_study_document(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Study sections: enforce the exact feedback section scope at database level.
-- ---------------------------------------------------------------------------
drop policy if exists sections_insert on public.study_sections;
create policy sections_insert on public.study_sections
for insert to authenticated
with check (public.can_edit_study_section(study_id, section_key));

drop policy if exists sections_update on public.study_sections;
create policy sections_update on public.study_sections
for update to authenticated
using (public.can_edit_study_section(study_id, section_key))
with check (public.can_edit_study_section(study_id, section_key));

drop policy if exists sections_delete on public.study_sections;
create policy sections_delete on public.study_sections
for delete to authenticated
using (public.can_edit_study_section(study_id, section_key) or public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- Document metadata: permit only documents belonging to the selected feedback
-- area. This prevents a modified browser from updating unrelated attachments.
-- ---------------------------------------------------------------------------
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
for insert to authenticated
with check (
  public.can_edit_study_document(study_id, document_type)
  and uploaded_by = auth.uid()
);

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
for delete to authenticated
using (
  public.can_edit_study_document(study_id, document_type)
  or public.current_user_is_admin()
);

-- Storage object path format is: <study_id>/<document_type>/<uuid>-<filename>
drop policy if exists sscs_documents_insert on storage.objects;
create policy sscs_documents_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'sscs-documents'
  and public.can_edit_study_document(
    split_part(name, '/', 1),
    split_part(name, '/', 2)
  )
);

drop policy if exists sscs_documents_update on storage.objects;
create policy sscs_documents_update on storage.objects
for update to authenticated
using (
  bucket_id = 'sscs-documents'
  and public.can_edit_study_document(
    split_part(name, '/', 1),
    split_part(name, '/', 2)
  )
)
with check (
  bucket_id = 'sscs-documents'
  and public.can_edit_study_document(
    split_part(name, '/', 1),
    split_part(name, '/', 2)
  )
);

drop policy if exists sscs_documents_delete on storage.objects;
create policy sscs_documents_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'sscs-documents'
  and (
    public.can_edit_study_document(
      split_part(name, '/', 1),
      split_part(name, '/', 2)
    )
    or public.current_user_is_admin()
  )
);

-- ---------------------------------------------------------------------------
-- Parent study row: General Information lives in sscs_studies.items, so a Ship
-- Officer may update the Submitted parent row only when General Information was
-- explicitly selected by Terminal feedback (__core__). Status must stay Submitted.
-- ---------------------------------------------------------------------------
drop policy if exists studies_ship_update on public.sscs_studies;
create policy studies_ship_update on public.sscs_studies
for update to authenticated
using (
  public.current_user_is_approved()
  and public.current_user_role() = 'ship_officer'
  and public.current_user_has_vessel_access(vessel_id)
  and (
    status in ('draft', 'editing', 'approved')
    or (status = 'submitted' and public.ship_feedback_allows_core(id))
  )
)
with check (
  public.current_user_has_vessel_access(vessel_id)
  and (
    status in ('draft', 'editing', 'submitted', 'edit_requested')
  )
);

-- Keep all existing protected-field checks from migration 007/008 and add the
-- Submitted -> Submitted feedback-only transition for General Information.
create or replace function public.enforce_ship_study_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_user_role() = 'ship_officer'
     and not public.current_user_is_admin()
     and coalesce(current_setting('app.vessel_rename_in_progress', true), 'off') <> 'on' then
    if new.initiated_by_id is distinct from old.initiated_by_id
       or new.initiated_by_name is distinct from old.initiated_by_name
       or new.initiated_by_role is distinct from old.initiated_by_role
       or new.vessel_id is distinct from old.vessel_id
       or new.vessel_name is distinct from old.vessel_name
       or new.terminal_notes is distinct from old.terminal_notes
       or new.reviewed_by_id is distinct from old.reviewed_by_id
       or new.reviewed_by_name is distinct from old.reviewed_by_name
       or new.approved_at is distinct from old.approved_at then
      raise exception 'Ship officers cannot modify protected study fields';
    end if;

    if not (
      (old.status = 'draft' and new.status in ('draft', 'submitted'))
      or (old.status = 'editing' and new.status in ('editing', 'submitted'))
      or (old.status = 'approved' and new.status = 'edit_requested')
      or (
        old.status = 'submitted'
        and new.status = 'submitted'
        and public.ship_feedback_allows_core(old.id)
      )
    ) then
      raise exception 'Invalid ship-officer study status transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

-- Existing aa_enforce_ship_study_update trigger already points to this function.
