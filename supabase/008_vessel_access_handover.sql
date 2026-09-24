-- Vessel access / ownership claim / Ship Officer handover for LMPT2 SSCS
-- This separates current vessel edit rights from historical study.initiated_by_id.

-- Track who actually submitted the current revision so workflow emails continue to
-- go to the active Ship Officer after a handover.
alter table public.sscs_studies
  add column if not exists submitted_by_id uuid references auth.users(id) on delete set null,
  add column if not exists submitted_by_name text;

create table if not exists public.vessel_access (
  id uuid primary key default gen_random_uuid(),
  vessel_id bigint not null references public.vessels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('claim','additional','handover','legacy')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  reason text not null default '',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  revoke_previous boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists vessel_access_vessel_idx on public.vessel_access(vessel_id);
create index if not exists vessel_access_user_idx on public.vessel_access(user_id);
create index if not exists vessel_access_pending_idx on public.vessel_access(vessel_id, requested_at desc) where status = 'pending';
create unique index if not exists vessel_access_one_open_per_user_vessel_idx
  on public.vessel_access(vessel_id, user_id)
  where status in ('pending','approved');

create or replace function public.current_user_has_vessel_access(target_vessel_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.current_user_is_approved()
     and exists (
       select 1
       from public.vessel_access va
       where va.vessel_id = target_vessel_id
         and va.user_id = auth.uid()
         and va.status = 'approved'
     );
$$;

grant execute on function public.current_user_has_vessel_access(bigint) to authenticated;

alter table public.vessel_access enable row level security;

grant select, insert on public.vessel_access to authenticated;

drop policy if exists vessel_access_select on public.vessel_access;
create policy vessel_access_select on public.vessel_access
for select to authenticated
using (
  public.current_user_is_approved()
  and (
    user_id = auth.uid()
    or public.current_user_is_admin()
    or public.current_user_role() = 'terminal_officer'
  )
);

drop policy if exists vessel_access_insert on public.vessel_access;
create policy vessel_access_insert on public.vessel_access
for insert to authenticated
with check (
  public.current_user_is_approved()
  and public.current_user_role() = 'ship_officer'
  and user_id = auth.uid()
  and status = 'pending'
  and request_type in ('claim','additional','handover')
);

-- Validate browser-created access requests. SQL migration/backfill rows run without
-- an auth.uid() and are intentionally allowed to create approved legacy mappings.
create or replace function public.validate_vessel_access_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();

  -- Internal legacy grants are protected by RLS/functions and may be created while
  -- an authenticated Terminal/Ship Officer session is active.
  if new.request_type = 'legacy' and new.status = 'approved' then
    return new;
  end if;

  if auth.uid() is not null then
    if new.user_id <> auth.uid()
       or public.current_user_role() <> 'ship_officer'
       or not public.current_user_is_approved() then
      raise exception 'Only an approved Ship Officer can request vessel access for themselves.';
    end if;

    if new.status <> 'pending' or new.request_type not in ('claim','additional','handover') then
      raise exception 'Invalid vessel access request.';
    end if;

    if new.request_type = 'claim' and exists (
      select 1 from public.vessel_access va
      where va.vessel_id = new.vessel_id
        and va.status = 'approved'
        and va.user_id <> new.user_id
    ) then
      raise exception 'This vessel already has an authorised Ship Officer. Use Additional Access or Handover instead.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_vessel_access_request on public.vessel_access;
create trigger trg_validate_vessel_access_request
before insert on public.vessel_access
for each row execute function public.validate_vessel_access_request();

-- Terminal Officer / Admin approval. Handover can revoke all previously approved
-- Ship Officers while preserving their historical studies and audit records.
create or replace function public.review_vessel_access(
  p_request_id uuid,
  p_status text,
  p_revoke_previous boolean default false
)
returns public.vessel_access
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  req public.vessel_access%rowtype;
begin
  if auth.uid() is null
     or not public.current_user_is_approved()
     or not (public.current_user_is_admin() or public.current_user_role() = 'terminal_officer') then
    raise exception 'Only a Terminal Officer or administrator can review vessel access requests.';
  end if;

  if p_status not in ('approved','rejected') then
    raise exception 'Invalid review status.';
  end if;

  select * into req
  from public.vessel_access
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Vessel access request not found.';
  end if;

  if req.status <> 'pending' then
    raise exception 'This vessel access request has already been reviewed.';
  end if;

  if p_status = 'approved' and req.request_type = 'claim' and exists (
    select 1 from public.vessel_access va
    where va.vessel_id = req.vessel_id
      and va.status = 'approved'
      and va.user_id <> req.user_id
  ) then
    raise exception 'This vessel already has an authorised Ship Officer. Review this request as Additional Access or Handover instead.';
  end if;

  if p_status = 'approved'
     and req.request_type = 'handover'
     and p_revoke_previous then
    update public.vessel_access
    set status = 'revoked',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        updated_at = now()
    where vessel_id = req.vessel_id
      and status = 'approved'
      and user_id <> req.user_id;
  end if;

  update public.vessel_access
  set status = p_status,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      revoke_previous = case when p_status = 'approved' then p_revoke_previous else false end,
      updated_at = now()
  where id = p_request_id
  returning * into req;

  insert into public.audit_logs(user_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    case when p_status = 'approved' then 'vessel_access_approved' else 'vessel_access_rejected' end,
    'vessel_access',
    req.id::text,
    jsonb_build_object(
      'vessel_id', req.vessel_id,
      'user_id', req.user_id,
      'request_type', req.request_type,
      'revoke_previous', req.revoke_previous
    )
  );

  return req;
end;
$$;

revoke all on function public.review_vessel_access(uuid, text, boolean) from public;
grant execute on function public.review_vessel_access(uuid, text, boolean) to authenticated;

-- Existing permissions become vessel-access rows so the migration does not take
-- rights away from Ship Officers already working in the system.
insert into public.vessel_access(vessel_id, user_id, request_type, status, reason, reviewed_at)
select distinct v.id, v.created_by, 'legacy', 'approved', 'Backfilled from vessel creator.', now()
from public.vessels v
join public.profiles p on p.id = v.created_by
where v.created_by is not null
  and p.role = 'ship_officer'
  and p.account_status = 'approved'
on conflict do nothing;

insert into public.vessel_access(vessel_id, user_id, request_type, status, reason, reviewed_at)
select distinct s.vessel_id, s.initiated_by_id, 'legacy', 'approved', 'Backfilled from an existing authorised SSCS study.', now()
from public.sscs_studies s
join public.profiles p on p.id = s.initiated_by_id
where p.role = 'ship_officer'
  and p.account_status = 'approved'
  and s.status in ('draft','submitted','approved','edit_requested','editing')
on conflict do nothing;

-- A Ship Officer who adds a new vessel owns access to it immediately, matching the
-- existing Add Vessel behaviour.
create or replace function public.grant_vessel_creator_access()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.created_by is not null and exists (
    select 1 from public.profiles p
    where p.id = new.created_by
      and p.role = 'ship_officer'
      and p.account_status = 'approved'
  ) then
    insert into public.vessel_access(vessel_id, user_id, request_type, status, reason, reviewed_at)
    values (new.id, new.created_by, 'legacy', 'approved', 'Automatically granted when the Ship Officer added the vessel.', now())
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_grant_vessel_creator_access on public.vessels;
create trigger trg_grant_vessel_creator_access
after insert on public.vessels
for each row execute function public.grant_vessel_creator_access();

-- Preserve the legacy study access-request flow: when Terminal approves an old
-- access_requested study and changes it to draft, create the equivalent vessel access.
create or replace function public.sync_study_authorisation_to_vessel_access()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  should_grant boolean := false;
begin
  -- Only translate the old access-request flow into vessel access. Do not run on
  -- later status changes (submit/approve/revision), otherwise a revoked previous
  -- Ship Officer could accidentally be granted access again after a handover.
  if tg_op = 'INSERT' then
    should_grant := new.status = 'draft';
  elsif tg_op = 'UPDATE' then
    should_grant := old.status = 'access_requested' and new.status = 'draft';
  end if;

  if should_grant
     and exists (
       select 1 from public.profiles p
       where p.id = new.initiated_by_id
         and p.role = 'ship_officer'
         and p.account_status = 'approved'
     ) then
    insert into public.vessel_access(vessel_id, user_id, request_type, status, reason, reviewed_at, reviewed_by)
    values (new.vessel_id, new.initiated_by_id, 'legacy', 'approved', 'Granted through legacy SSCS study access approval.', now(), auth.uid())
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_study_authorisation_to_vessel_access on public.sscs_studies;
create trigger trg_sync_study_authorisation_to_vessel_access
after insert or update of status on public.sscs_studies
for each row execute function public.sync_study_authorisation_to_vessel_access();

-- Study edit rights now follow vessel access as well as Terminal/Admin rights.
create or replace function public.can_edit_study(target_study_id text)
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
          and s.status in ('draft','editing')
        )
      )
  );
$$;

-- Ship Officers may create a draft only for vessels they are authorised to manage.
-- Legacy access_requested study rows remain supported for backward compatibility.
drop policy if exists studies_insert on public.sscs_studies;
create policy studies_insert on public.sscs_studies
for insert to authenticated
with check (
  public.current_user_is_approved()
  and initiated_by_id = auth.uid()
  and (
    public.current_user_is_admin()
    or public.current_user_role() = 'terminal_officer'
    or (
      public.current_user_role() = 'ship_officer'
      and (
        status = 'access_requested'
        or (status = 'draft' and public.current_user_has_vessel_access(vessel_id))
      )
    )
  )
);

drop policy if exists studies_ship_update on public.sscs_studies;
create policy studies_ship_update on public.sscs_studies
for update to authenticated
using (
  public.current_user_is_approved()
  and public.current_user_role() = 'ship_officer'
  and public.current_user_has_vessel_access(vessel_id)
  and status in ('draft','editing','approved')
)
with check (
  public.current_user_has_vessel_access(vessel_id)
  and status in ('draft','editing','submitted','edit_requested')
);

-- Vessel rename remains an explicit operation, but any currently approved Ship
-- Officer for the vessel can perform it. IMO remains immutable under migration 007.
create or replace function public.rename_vessel_everywhere(p_vessel_id bigint, p_new_name text)
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
       or public.current_user_has_vessel_access(p_vessel_id)
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
