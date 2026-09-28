-- LMPT2 SSCS Minor Change 2
-- Shared sister-ship document replacement.
-- Only the inherited document set (Drawing 2.1-2.5, Manual 3.x, Optimoor 4.x)
-- receives this exception. All other Approved-study content remains locked.

create or replace function public.can_update_sister_shared_document(
  target_study_id text,
  target_document_type text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_document_type = any(array[
    'd_2_1','d_2_2','d_2_3','d_2_4','d_2_5',
    'd_3_1','d_3_2','d_3_3','d_3_4',
    'd_4_1','d_4_2'
  ])
  and public.current_user_is_approved()
  and exists (
    select 1
    from public.sscs_studies s
    join public.vessels v on v.id = s.vessel_id
    where s.id = target_study_id
      and (
        (v.is_sister_ship = true and v.sister_ship_status = 'verified' and v.reference_vessel_id is not null)
        or exists (
          select 1 from public.vessels sv
          where sv.reference_vessel_id = v.id
            and sv.is_sister_ship = true
            and sv.sister_ship_status = 'verified'
        )
      )
      and (
        public.current_user_is_admin()
        or public.current_user_role() = 'terminal_officer'
        or (
          public.current_user_role() = 'ship_officer'
          and public.current_user_has_vessel_access(s.vessel_id)
        )
      )
  );
$$;

revoke all on function public.can_update_sister_shared_document(text, text) from public;
grant execute on function public.can_update_sister_shared_document(text, text) to authenticated;

-- Permit uploading/replacing only shared sister-ship document objects/metadata.
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
for insert to authenticated
with check (
  (public.can_edit_study_document(study_id, document_type)
   or public.can_update_sister_shared_document(study_id, document_type))
  and uploaded_by = auth.uid()
);

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
for delete to authenticated
using (
  public.can_edit_study_document(study_id, document_type)
  or public.can_update_sister_shared_document(study_id, document_type)
);

drop policy if exists sscs_documents_insert on storage.objects;
create policy sscs_documents_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'sscs-documents'
  and (
    public.can_edit_study_document(split_part(name, '/', 1), split_part(name, '/', 2))
    or public.can_update_sister_shared_document(split_part(name, '/', 1), split_part(name, '/', 2))
  )
);

drop policy if exists sscs_documents_delete on storage.objects;
create policy sscs_documents_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'sscs-documents'
  and (
    public.can_edit_study_document(split_part(name, '/', 1), split_part(name, '/', 2))
    or public.can_update_sister_shared_document(split_part(name, '/', 1), split_part(name, '/', 2))
  )
);

create or replace function public.replace_sister_shared_document(
  target_vessel_id bigint,
  target_document_type text,
  replacement_files jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  root_vessel_id bigint;
begin
  if target_document_type <> all(array[
    'd_2_1','d_2_2','d_2_3','d_2_4','d_2_5',
    'd_3_1','d_3_2','d_3_3','d_3_4',
    'd_4_1','d_4_2'
  ]) then
    raise exception 'Document type is not shared between sister ships';
  end if;

  if not public.current_user_is_approved() then
    raise exception 'Approved account required';
  end if;

  select case
    when v.is_sister_ship and v.sister_ship_status = 'verified' then v.reference_vessel_id
    else v.id
  end
  into root_vessel_id
  from public.vessels v
  where v.id = target_vessel_id;

  if root_vessel_id is null then
    raise exception 'Verified sister-ship group not found';
  end if;

  if not (
    public.current_user_is_admin()
    or public.current_user_role() = 'terminal_officer'
    or (
      public.current_user_role() = 'ship_officer'
      and public.current_user_has_vessel_access(target_vessel_id)
    )
  ) then
    raise exception 'Not authorised to update this sister-ship group';
  end if;

  if not exists (
    select 1 from public.vessels sv
    where sv.reference_vessel_id = root_vessel_id
      and sv.is_sister_ship = true
      and sv.sister_ship_status = 'verified'
  ) then
    raise exception 'No verified sister ships use this shared document set';
  end if;

  insert into public.study_sections (study_id, section_key, data, updated_by, updated_at)
  select s.id,
         'required_documents',
         jsonb_build_object(target_document_type, coalesce(replacement_files, '[]'::jsonb)),
         auth.uid(),
         now()
  from public.sscs_studies s
  join public.vessels v on v.id = s.vessel_id
  where v.id = root_vessel_id
     or (v.reference_vessel_id = root_vessel_id and v.is_sister_ship = true and v.sister_ship_status = 'verified')
  on conflict (study_id, section_key) do update
  set data = coalesce(public.study_sections.data, '{}'::jsonb)
             || jsonb_build_object(target_document_type, coalesce(replacement_files, '[]'::jsonb)),
      updated_by = auth.uid(),
      updated_at = now();

  insert into public.audit_logs(user_id, action, entity_type, entity_id, details)
  values (
    auth.uid(), 'sister_shared_document_replaced', 'vessel', target_vessel_id::text,
    jsonb_build_object('root_vessel_id', root_vessel_id, 'document_type', target_document_type)
  );
end;
$$;

revoke all on function public.replace_sister_shared_document(bigint, text, jsonb) from public;
grant execute on function public.replace_sister_shared_document(bigint, text, jsonb) to authenticated;

-- ============================================================
-- Minor Change 2
-- Correct verified sister-ship update handling
--
-- A Ship Officer must not be able to VERIFY or alter the
-- verification relationship, but normal updates to a vessel
-- that is already verified must remain possible.
-- ============================================================

create or replace function public.enforce_sister_ship_workflow()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  role_name text := public.current_user_role();
  ref_study public.sscs_studies%rowtype;
begin
  if not coalesce(new.is_sister_ship, false) then
    new.reference_vessel_id := null;
    new.sister_ship_status := 'none';
    new.sister_reference_study_id := null;
    new.sister_ship_verified_by := null;
    new.sister_ship_verified_at := null;
    return new;
  end if;

  if new.reference_vessel_id is null then
    raise exception 'A sister ship must reference another vessel.';
  end if;

  if new.id is not null and new.reference_vessel_id = new.id then
    raise exception 'A vessel cannot reference itself as a sister ship.';
  end if;

  -- Ship Officers may propose a sister relationship, but may not
  -- change an existing sister-ship relationship or verification data.
  if role_name = 'ship_officer'
     and not public.current_user_is_admin() then

    if tg_op = 'INSERT' then
      if new.sister_ship_status not in ('pending', 'none')
        or new.sister_ship_verified_by is not null
        or new.sister_ship_verified_at is not null
        or new.sister_reference_study_id is not null then
        raise exception 'Ship Officers cannot verify a sister ship.';
      end if;

      new.sister_ship_status := 'pending';

    else
      if new.reference_vessel_id is distinct from old.reference_vessel_id
        or new.is_sister_ship is distinct from old.is_sister_ship
        or new.sister_ship_status is distinct from old.sister_ship_status
        or new.sister_ship_verified_by is distinct from old.sister_ship_verified_by
        or new.sister_ship_verified_at is distinct from old.sister_ship_verified_at
        or new.sister_reference_study_id is distinct from old.sister_reference_study_id then
        raise exception 'Only a Terminal Officer can change sister ship verification.';
      end if;
    end if;
  end if;

  if new.sister_ship_status = 'verified' then

    -- IMPORTANT:
    -- Only the transition INTO "verified" requires Terminal Officer/Admin.
    --
    -- An already verified sister ship may still receive normal vessel
    -- updates from an authorised Ship Officer.
    if (
      tg_op = 'INSERT'
      or old.sister_ship_status is distinct from 'verified'
    ) and not (
      public.current_user_is_admin()
      or role_name = 'terminal_officer'
    ) then
      raise exception 'Only a Terminal Officer can verify a sister ship.';
    end if;

    if new.sister_reference_study_id is null then
      raise exception
        'A verified sister ship must reference an approved SSCS study.';
    end if;

    select *
      into ref_study
    from public.sscs_studies
    where id = new.sister_reference_study_id;

    if not found
      or ref_study.vessel_id <> new.reference_vessel_id
      or ref_study.status <> 'approved' then
      raise exception
        'The sister ship reference study must be an approved study of the selected reference vessel.';
    end if;

    if new.sister_ship_verified_by is null then
      new.sister_ship_verified_by := auth.uid();
    end if;

    if new.sister_ship_verified_at is null then
      new.sister_ship_verified_at := now();
    end if;

  elsif new.sister_ship_status in ('pending', 'rejected') then
    new.sister_reference_study_id := null;
    new.sister_ship_verified_by := null;
    new.sister_ship_verified_at := null;
  end if;

  return new;
end;
$$;
