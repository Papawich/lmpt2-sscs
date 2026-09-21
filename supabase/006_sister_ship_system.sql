-- Sister Ship workflow for LMPT2 SSCS
-- Adds a verified reference-vessel relationship. Reference content is copied into
-- the sister vessel's current study only after a Terminal Officer verifies it.

alter table public.vessels
  add column if not exists is_sister_ship boolean not null default false,
  add column if not exists reference_vessel_id bigint references public.vessels(id) on delete set null,
  add column if not exists sister_ship_status text not null default 'none',
  add column if not exists sister_ship_verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists sister_ship_verified_at timestamptz,
  add column if not exists sister_reference_study_id text references public.sscs_studies(id) on delete set null;

create index if not exists vessels_reference_vessel_idx
  on public.vessels(reference_vessel_id);

create index if not exists vessels_sister_ship_status_idx
  on public.vessels(sister_ship_status)
  where is_sister_ship = true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vessels_sister_ship_status_check'
      and conrelid = 'public.vessels'::regclass
  ) then
    alter table public.vessels
      add constraint vessels_sister_ship_status_check
      check (sister_ship_status in ('none','pending','verified','rejected'));
  end if;
end $$;

create or replace function public.enforce_sister_ship_workflow()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ref_study public.sscs_studies%rowtype;
  role_name text;
begin
  role_name := public.current_user_role();

  if not new.is_sister_ship then
    new.reference_vessel_id := null;
    new.sister_ship_status := 'none';
    new.sister_ship_verified_by := null;
    new.sister_ship_verified_at := null;
    new.sister_reference_study_id := null;
    return new;
  end if;

  if new.reference_vessel_id is null then
    raise exception 'A sister ship must reference an existing vessel.';
  end if;

  if new.id is not null and new.reference_vessel_id = new.id then
    raise exception 'A vessel cannot reference itself as a sister ship.';
  end if;

  -- Ship Officers may propose a sister relationship, but only Terminal Officers
  -- or admins may verify/reject it or alter the verification fields.
  if role_name = 'ship_officer' and not public.current_user_is_admin() then
    if tg_op = 'INSERT' then
      if new.sister_ship_status not in ('pending','none')
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
    if not (public.current_user_is_admin() or role_name = 'terminal_officer') then
      raise exception 'Only a Terminal Officer can verify a sister ship.';
    end if;
    if new.sister_reference_study_id is null then
      raise exception 'A verified sister ship must reference an approved SSCS study.';
    end if;

    select * into ref_study
    from public.sscs_studies
    where id = new.sister_reference_study_id;

    if not found
      or ref_study.vessel_id <> new.reference_vessel_id
      or ref_study.status <> 'approved' then
      raise exception 'The sister ship reference study must be an approved study of the selected reference vessel.';
    end if;

    if new.sister_ship_verified_by is null then
      new.sister_ship_verified_by := auth.uid();
    end if;
    if new.sister_ship_verified_at is null then
      new.sister_ship_verified_at := now();
    end if;
  elsif new.sister_ship_status in ('pending','rejected') then
    new.sister_reference_study_id := null;
    new.sister_ship_verified_by := null;
    new.sister_ship_verified_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_sister_ship_workflow on public.vessels;
create trigger trg_enforce_sister_ship_workflow
before insert or update on public.vessels
for each row execute function public.enforce_sister_ship_workflow();
