-- LMPT2 SSCS Minor Change 1.1 Final
-- Approved study content is read-only for every interactive role.
--
-- Rules after this migration:
--   * Terminal Officer may edit content while status = Draft / Submitted / Editing.
--   * Ship Officer may edit Draft / Editing, plus only feedback-selected parts
--     while status = Submitted.
--   * Once status = Approved, study content / sections / documents are locked.
--   * Ship Officer can still request an Edit (Approved -> Edit Requested).
--   * Terminal Officer can then approve the edit request (-> Editing), after
--     which content becomes editable again through the controlled edit cycle.
--   * The controlled global vessel-name rename function remains able to update
--     the canonical vessel name in historical studies because it is SECURITY
--     DEFINER and uses its own validated workflow.
--
-- Prerequisite: 009_minor_change_1_feedback_permissions.sql has been applied.

-- ---------------------------------------------------------------------------
-- Section/document helper functions: Terminal/Admin no longer bypass the lock
-- on Approved studies. Approved content is immutable until a formal edit cycle.
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
        (
          (public.current_user_is_admin() or public.current_user_role() = 'terminal_officer')
          and s.status in ('draft', 'submitted', 'editing')
        )
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
        (
          (public.current_user_is_admin() or public.current_user_role() = 'terminal_officer')
          and s.status in ('draft', 'submitted', 'editing')
        )
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
-- Remove Admin delete bypasses on Approved content. The helper function above
-- now decides whether a content mutation is allowed for all roles.
-- ---------------------------------------------------------------------------
drop policy if exists sections_delete on public.study_sections;
create policy sections_delete on public.study_sections
for delete to authenticated
using (public.can_edit_study_section(study_id, section_key));

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
for delete to authenticated
using (public.can_edit_study_document(study_id, document_type));

drop policy if exists sscs_documents_delete on storage.objects;
create policy sscs_documents_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'sscs-documents'
  and public.can_edit_study_document(
    split_part(name, '/', 1),
    split_part(name, '/', 2)
  )
);

-- INSERT / UPDATE policies from migration 009 already call the helper functions,
-- so the new helper definitions automatically apply the Approved lock to them.

-- ---------------------------------------------------------------------------
-- Parent study row: Terminal/Admin may process a study until it is Approved,
-- but cannot directly modify an already-Approved row. The WITH CHECK includes
-- Approved so Submitted/Editing -> Approved remains valid.
--
-- Ship Officer Approved -> Edit Requested remains controlled by the separate
-- studies_ship_update policy and enforce_ship_study_update() trigger.
-- ---------------------------------------------------------------------------
drop policy if exists studies_terminal_update on public.sscs_studies;
create policy studies_terminal_update on public.sscs_studies
for update to authenticated
using (
  public.current_user_is_approved()
  and (public.current_user_is_admin() or public.current_user_role() = 'terminal_officer')
  and status in ('draft', 'submitted', 'edit_requested', 'editing')
)
with check (
  public.current_user_is_approved()
  and (public.current_user_is_admin() or public.current_user_role() = 'terminal_officer')
  and status in ('draft', 'submitted', 'approved', 'edit_requested', 'editing')
);
