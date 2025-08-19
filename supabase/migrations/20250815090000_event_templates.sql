-- event_templates: draft templates per event; published copy on events.template
create table if not exists public.event_templates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null default 'Default',
  data jsonb not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_templates_event_id_idx on public.event_templates(event_id);

-- add template column on events for published snapshot
alter table public.events
  add column if not exists template jsonb default null;

-- simple updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_event_templates_updated_at
before update on public.event_templates
for each row execute function public.set_updated_at();

-- RLS policies (indicative): organizer can manage within account scope
alter table public.event_templates enable row level security;

-- Assuming a view organizer_events(event_id, organizer_id) exists
create policy organizer_manage_event_templates on public.event_templates
for all using (
  auth.role() = 'organizer' and event_id in (
    select event_id from public.organizer_events where organizer_id = auth.uid()
  )
);

-- read-only for players within event scope
create policy player_read_event_templates on public.event_templates
for select using (
  current_setting('app.session_id', true) is not null and event_id in (
    select event_id from public.sessions where id = current_setting('app.session_id', true)
  )
);
