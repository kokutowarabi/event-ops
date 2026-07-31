-- Allow one vote per device, project, and festival day.
alter table public.visitor_votes
  drop constraint if exists visitor_votes_pkey;

alter table public.visitor_votes
  add constraint visitor_votes_pkey
  primary key (device_id, project_id, voted_on);

drop function if exists public.cast_visitor_vote(uuid, text, date);

create function public.cast_visitor_vote(
  p_device_id uuid,
  p_project_id text,
  p_voted_on date
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_rows integer;
begin
  if p_voted_on not in (date '2026-10-31', date '2026-11-01', date '2026-11-02') then
    raise exception 'Voting date is outside the festival period';
  end if;

  if not exists (
    select 1
    from public.vote_projects
    where project_id = p_project_id
  ) then
    raise exception 'Unknown project';
  end if;

  insert into public.visitor_votes (device_id, project_id, voted_on)
  values (p_device_id, p_project_id, p_voted_on)
  on conflict (device_id, project_id, voted_on) do nothing;

  get diagnostics inserted_rows = row_count;
  return inserted_rows = 1;
end;
$$;

revoke all on function public.cast_visitor_vote(uuid, text, date) from public;
grant execute on function public.cast_visitor_vote(uuid, text, date) to anon, authenticated;
