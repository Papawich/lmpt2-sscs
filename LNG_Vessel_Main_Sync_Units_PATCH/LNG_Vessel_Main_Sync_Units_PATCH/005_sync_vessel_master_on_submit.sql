-- Keep public.vessels synchronized with the latest submitted SSCS General Information.
-- This updates only vessel-master fields mapped from gi-01..gi-13.

create or replace function public.sync_vessel_master_from_study(target_study_id text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.sscs_studies%rowtype;
  gi01 text; gi02 text; gi03 text; gi04 text; gi05 text; gi06 text; gi07 text;
  gi08 text; gi09 text; gi10 text; gi11 text; gi12 text; gi13 text;
begin
  select * into s
  from public.sscs_studies
  where id = target_study_id;

  if not found or s.submitted_at is null then
    return;
  end if;

  select
    max(value) filter (where item_id = 'gi-01'),
    max(value) filter (where item_id = 'gi-02'),
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
  into gi01, gi02, gi03, gi04, gi05, gi06, gi07, gi08, gi09, gi10, gi11, gi12, gi13
  from (
    select
      elem->>'id' as item_id,
      nullif(btrim(coalesce(elem->>'value', '')), '') as value
    from jsonb_array_elements(coalesce(s.items, '[]'::jsonb)) elem
  ) x;

  update public.vessels v
  set
    name = coalesce(gi01, v.name),
    imo = coalesce(gi02, v.imo),
    call_sign = coalesce(gi03, v.call_sign),
    flag = coalesce(gi04, v.flag),
    port_of_registry = coalesce(gi05, v.port_of_registry),
    year_built = case
      when gi06 ~ '^\d{4}$' then gi06::integer
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

  if gi01 is not null and gi01 is distinct from s.vessel_name then
    update public.sscs_studies
    set vessel_name = gi01,
        updated_at = now()
    where id = s.id;
  end if;
end;
$$;

revoke all on function public.sync_vessel_master_from_study(text) from public;

create or replace function public.sync_vessel_master_after_submit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'submitted'
     and old.status is distinct from new.status then
    perform public.sync_vessel_master_from_study(new.id);
  end if;
  return new;
end;
$$;

revoke all on function public.sync_vessel_master_after_submit() from public;

drop trigger if exists trg_sync_vessel_master_after_submit on public.sscs_studies;
create trigger trg_sync_vessel_master_after_submit
after update of status on public.sscs_studies
for each row
execute function public.sync_vessel_master_after_submit();

-- One-time backfill: align existing vessel master rows with the most recently
-- submitted study for each vessel so current mismatches are corrected now.
do $$
declare
  r record;
begin
  for r in
    select distinct on (vessel_id) id
    from public.sscs_studies
    where submitted_at is not null
    order by vessel_id, submitted_at desc, initiated_at desc
  loop
    perform public.sync_vessel_master_from_study(r.id);
  end loop;
end;
$$;
