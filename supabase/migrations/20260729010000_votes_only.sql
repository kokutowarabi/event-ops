-- Supabase is used only for the public project vote.
drop table if exists public.event_ops_state cascade;
drop function if exists public.cast_visitor_vote(uuid, text);

create table if not exists public.vote_projects (
  project_id text primary key
);

insert into public.vote_projects (project_id)
select 'project-' || project_number
from generate_series(1, 40) as project_number
on conflict (project_id) do nothing;

create table if not exists public.visitor_votes (
  device_id uuid primary key,
  project_id text not null,
  voted_on date not null default date '2026-10-31',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visitor_votes
  add column if not exists voted_on date not null default date '2026-10-31';

delete from public.visitor_votes
where project_id not in (select project_id from public.vote_projects)
   or voted_on not in (date '2026-10-31', date '2026-11-01', date '2026-11-02');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visitor_votes_project_id_fkey'
      and conrelid = 'public.visitor_votes'::regclass
  ) then
    alter table public.visitor_votes
      add constraint visitor_votes_project_id_fkey
      foreign key (project_id)
      references public.vote_projects(project_id);
  end if;
end;
$$;

alter table public.vote_projects enable row level security;
alter table public.visitor_votes enable row level security;

revoke all on public.vote_projects from anon, authenticated;
revoke all on public.visitor_votes from anon, authenticated;
grant select on public.vote_projects to anon, authenticated;
grant select on public.visitor_votes to anon, authenticated;

drop policy if exists "public can read vote projects" on public.vote_projects;
create policy "public can read vote projects"
on public.vote_projects
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated users can read visitor votes" on public.visitor_votes;
drop policy if exists "public can read visitor votes" on public.visitor_votes;
create policy "public can read visitor votes"
on public.visitor_votes
for select
to anon, authenticated
using (true);

create or replace function public.set_vote_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_visitor_votes_updated_at on public.visitor_votes;
create trigger set_visitor_votes_updated_at
before update on public.visitor_votes
for each row execute function public.set_vote_updated_at();

create or replace function public.cast_visitor_vote(
  p_device_id uuid,
  p_project_id text,
  p_voted_on date
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
  on conflict (device_id)
  do update set
    project_id = excluded.project_id,
    voted_on = excluded.voted_on,
    updated_at = now();
end;
$$;

revoke all on function public.cast_visitor_vote(uuid, text, date) from public;
grant execute on function public.cast_visitor_vote(uuid, text, date) to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'visitor_votes'
  ) then
    alter publication supabase_realtime add table public.visitor_votes;
  end if;
end;
$$;
