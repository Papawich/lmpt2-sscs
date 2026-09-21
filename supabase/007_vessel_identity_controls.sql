-- Vessel identity controls for LMPT2 SSCS
-- 1) IMO is immutable after vessel creation.
-- 2) Ship name can only be changed through rename_vessel_everywhere().
-- 3) Ship name and IMO inside every SSCS study are kept equal to the vessel master.
-- 4) General Information submit sync never changes vessel name or IMO.

-- ---------------------------------------------------------------------------
-- Protect vessel identity at database level.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_vessel_identity_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.imo is distinct from old.imo then
    raise exception 'IMO number cannot be changed after the vessel is created.';
  end if;

  if new.name is distinct from old.name
     and coalesce(current_setting('app.vessel_rename_in_progress', true), 'off') <> 'on' then
    raise exception 'Use the Change Ship Name action to rename a vessel.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_vessel_identity_update() from public;

drop trigger if exists a0_enforce_vessel_identity_update on public.vessels;
create trigger a0_enforce_vessel_identity_update
before update on public.vessels
for each row execute function public.enforce_vessel_identity_update();

-- ---------------------------------------------------------------------------
-- Keep identity fields inside a study equal to public.vessels.
-- This also protects against a modified browser/API request changing IMO.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_study_vessel_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  canonical_name text;
  canonical_imo text;
begin
  select name, imo
    into canonical_name, canonical_imo
  from public.vessels
  where id = new.vessel_id;

  if canonical_name is null then
    return new;
  end if;

  new.vessel_name := canonical_name;
  new.items := coalesce((
    select jsonb_agg(
      case
        when elem->>'id' = 'gi-01' then jsonb_set(elem, '{value}', to_jsonb(canonical_name), true)
        when elem->>'id' = 'gi-02' then jsonb_set(elem, '{value}', to_jsonb(canonical_imo), true)
        else elem
      end
      order by ord
    )
    from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) with ordinality as x(elem, ord)
  ), '[]'::jsonb);

  return new;
end;
$$;

revoke all on function public.enforce_study_vessel_identity() from public;

drop trigger if exists a0_enforce_study_vessel_identity on public.sscs_studies;
create trigger a0_enforce_study_vessel_identity
before insert or update on public.sscs_studies
for each row execute function public.enforce_study_vessel_identity();

-- Ship officers normally cannot alter vessel_name. The only exception is the
-- controlled rename transaction below, which validates permission separately.
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
      (old.status = 'draft' and new.status in ('draft','submitted'))
      or (old.status = 'editing' and new.status in ('editing','submitted'))
      or (old.status = 'approved' and new.status = 'edit_requested')
    ) then
      raise exception 'Invalid ship-officer study status transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Controlled global rename. Updates the vessel master plus every study and
-- General Information Ship's Name field for this vessel in one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.rename_vessel_everywhere(
  p_vessel_id bigint,
  p_new_name text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.vessels%rowtype;
  clean_name text := btrim(coalesce(p_new_name, ''));
  role_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if clean_name = '' then
    raise exception 'Ship name is required.';
  end if;

  if char_length(clean_name) > 160 then
    raise exception 'Ship name is too long.';
  end if;

  select * into target
  from public.vessels
  where id = p_vessel_id
  for update;

  if not found then
    raise exception 'Vessel not found.';
  end if;

  role_name := public.current_user_role();
  if not (public.current_user_is_approved() or public.current_user_is_admin())
     or not (
       public.current_user_is_admin()
       or role_name = 'terminal_officer'
       or target.created_by = auth.uid()
     ) then
    raise exception 'You are not authorised to change this ship name.';
  end if;

  if clean_name = target.name then
    return;
  end if;

  perform set_config('app.vessel_rename_in_progress', 'on', true);

  update public.vessels
  set name = clean_name,
      updated_at = now()
  where id = p_vessel_id;

  update public.sscs_studies s
  set vessel_name = clean_name,
      items = coalesce((
        select jsonb_agg(
          case
            when elem->>'id' = 'gi-01' then jsonb_set(elem, '{value}', to_jsonb(clean_name), true)
            else elem
          end
          order by ord
        )
        from jsonb_array_elements(coalesce(s.items, '[]'::jsonb)) with ordinality as x(elem, ord)
      ), '[]'::jsonb),
      updated_at = now()
  where s.vessel_id = p_vessel_id;

  insert into public.audit_logs(user_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    'vessel_name_changed',
    'vessel',
    p_vessel_id::text,
    jsonb_build_object('old_name', target.name, 'new_name', clean_name, 'imo', target.imo)
  );
end;
$$;

revoke all on function public.rename_vessel_everywhere(bigint, text) from public;
grant execute on function public.rename_vessel_everywhere(bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- General Information submit sync: identity fields are NOT writable here.
-- IMO is immutable and Ship Name has its own explicit rename flow.
-- ---------------------------------------------------------------------------
create or replace function public.sync_vessel_master_from_study(target_study_id text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.sscs_studies%rowtype;
  gi03 text; gi04 text; gi05 text; gi06 text; gi07 text;
  gi08 text; gi09 text; gi10 text; gi11 text; gi12 text; gi13 text;
begin
  select * into s
  from public.sscs_studies
  where id = target_study_id;

  if not found or s.submitted_at is null then
    return;
  end if;

  select
    max(value) filter (where item_id = 'gi-03'),
    max(value) filter (where item_id = 'gi-04'),
    max(value) filter (where item_id = 'gi-05'),
    max(value) filter (where item_id = 'gi-06'),
    max(value) filter (where item_id = 'gi-07'),
    max(value) filter (where item_id = 'gi-08'),
    max(value) filter (where item_id = 'gi-09'),
    max(value) filter (where item_id = 'gi-10'),
    max(value) filter (where item_id = 'gi-11'),
    max(value) filter (where item_id = 'gi-12'),
    max(value) filter (where item_id = 'gi-13')
  into gi03, gi04, gi05, gi06, gi07, gi08, gi09, gi10, gi11, gi12, gi13
  from (
    select
      elem->>'id' as item_id,
      nullif(btrim(coalesce(elem->>'value', '')), '') as value
    from jsonb_array_elements(coalesce(s.items, '[]'::jsonb)) elem
  ) x;

  update public.vessels v
  set
    call_sign = coalesce(gi03, v.call_sign),
    flag = coalesce(gi04, v.flag),
    port_of_registry = coalesce(gi05, v.port_of_registry),
    year_built = case
      when gi06 ~ '^[0-9]{4}$' then gi06::integer
      else v.year_built
    end,
    owner = coalesce(gi07, v.owner),
    operator = coalesce(gi08, v.operator),
    vessel_type = coalesce(gi09, v.vessel_type),
    capacity = case
      when gi10 is null then v.capacity
      when gi10 ~* '(m³|m3)' then gi10
      else gi10 || ' m³'
    end,
    classification = coalesce(gi11, v.classification),
    gas_mgmt_1 = coalesce(gi12, v.gas_mgmt_1),
    gas_mgmt_2 = coalesce(gi13, v.gas_mgmt_2),
    updated_at = now()
  where v.id = s.vessel_id;
end;
$$;

revoke all on function public.sync_vessel_master_from_study(text) from public;

-- One-time cleanup: make every existing study use the current vessel-master
-- Ship Name and immutable IMO so old mismatches disappear immediately.
do $$
begin
  perform set_config('app.vessel_rename_in_progress', 'on', true);

  update public.sscs_studies s
  set vessel_name = v.name,
      items = coalesce((
        select jsonb_agg(
          case
            when elem->>'id' = 'gi-01' then jsonb_set(elem, '{value}', to_jsonb(v.name), true)
            when elem->>'id' = 'gi-02' then jsonb_set(elem, '{value}', to_jsonb(v.imo), true)
            else elem
          end
          order by ord
        )
        from jsonb_array_elements(coalesce(s.items, '[]'::jsonb)) with ordinality as x(elem, ord)
      ), '[]'::jsonb),
      updated_at = now()
  from public.vessels v
  where v.id = s.vessel_id;
end;
$$;
