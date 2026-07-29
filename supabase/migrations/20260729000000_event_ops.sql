create table if not exists public.event_ops_state (
  id text primary key check (id = 'main'),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table if not exists public.visitor_votes (
  device_id uuid primary key,
  project_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_ops_state enable row level security;
alter table public.visitor_votes enable row level security;

grant select, insert, update, delete on public.event_ops_state to authenticated;
grant select on public.visitor_votes to authenticated;

create policy "authenticated users can read shared event data"
on public.event_ops_state
for select
to authenticated
using (true);

create policy "authenticated users can insert shared event data"
on public.event_ops_state
for insert
to authenticated
with check (true);

create policy "authenticated users can update shared event data"
on public.event_ops_state
for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can delete shared event data"
on public.event_ops_state
for delete
to authenticated
using (true);

create policy "authenticated users can read visitor votes"
on public.visitor_votes
for select
to authenticated
using (true);

create or replace function public.set_event_ops_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_event_ops_state_updated_at on public.event_ops_state;
create trigger set_event_ops_state_updated_at
before update on public.event_ops_state
for each row execute function public.set_event_ops_updated_at();

drop trigger if exists set_visitor_votes_updated_at on public.visitor_votes;
create trigger set_visitor_votes_updated_at
before update on public.visitor_votes
for each row execute function public.set_event_ops_updated_at();

create or replace function public.cast_visitor_vote(
  p_device_id uuid,
  p_project_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.visitor_votes (device_id, project_id)
  values (p_device_id, p_project_id)
  on conflict (device_id)
  do update set
    project_id = excluded.project_id,
    updated_at = now();
end;
$$;

revoke all on function public.cast_visitor_vote(uuid, text) from public;
grant execute on function public.cast_visitor_vote(uuid, text) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.event_ops_state;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.visitor_votes;
exception
  when duplicate_object then null;
end;
$$;
