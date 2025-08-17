-- Multi-tenant foundations: accounts, events, event_id columns + backfill
-- Safe/Idempotent style where possible

-- Enable extensions if needed
create extension if not exists pgcrypto;

-- Accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text,
  created_at timestamptz not null default now()
);

-- Events (tenant)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  name text not null,
  slug text unique,
  event_date date,
  is_public boolean not null default false,
  theme jsonb,
  billing_status text default 'unpaid',
  created_at timestamptz not null default now()
);

-- Create a legacy default account/event for backfill
do $$
begin
  if not exists (select 1 from public.accounts where name = 'Legacy') then
    insert into public.accounts(name, owner_email) values ('Legacy', null);
  end if;
end $$;

do $$
declare legacy_account_id uuid;
begin
  select id into legacy_account_id from public.accounts where name = 'Legacy' limit 1;
  if not exists (select 1 from public.events where slug = 'legacy') then
    insert into public.events(account_id, name, slug, is_public)
    values (legacy_account_id, 'Legacy Event', 'legacy', true);
  end if;
end $$;

-- Helper: get legacy event id
create or replace view public._legacy_event as
select id from public.events where slug = 'legacy' limit 1;

-- Add event_id to existing tables (nullable first)
alter table if exists public.sessions add column if not exists event_id uuid references public.events(id);
alter table if exists public.bingo_tasks add column if not exists event_id uuid references public.events(id);
alter table if exists public.treasure_hunt add column if not exists event_id uuid references public.events(id);
alter table if exists public.challenges add column if not exists event_id uuid references public.events(id);
alter table if exists public.live_messages add column if not exists event_id uuid references public.events(id);
alter table if exists public.shop_purchases add column if not exists event_id uuid references public.events(id);
alter table if exists public.points_history add column if not exists event_id uuid references public.events(id);

-- Backfill sessions.event_id with legacy
update public.sessions s
set event_id = (select id from public._legacy_event)
where s.event_id is null;

-- Backfill child tables' event_id from sessions via session_id
update public.bingo_tasks bt
set event_id = s.event_id
from public.sessions s
where bt.session_id = s.id and bt.event_id is null;

update public.treasure_hunt t
set event_id = s.event_id
from public.sessions s
where t.session_id = s.id and t.event_id is null;

update public.challenges c
set event_id = s.event_id
from public.sessions s
where c.session_id = s.id and c.event_id is null;

update public.live_messages lm
set event_id = s.event_id
from public.sessions s
where lm.session_id = s.id and lm.event_id is null;

update public.shop_purchases sp
set event_id = s.event_id
from public.sessions s
where sp.session_id = s.id and sp.event_id is null;

update public.points_history ph
set event_id = s.event_id
from public.sessions s
where ph.session_id = s.id and ph.event_id is null;

-- Indexes
create index if not exists idx_sessions_event on public.sessions(event_id);
create index if not exists idx_bingo_tasks_event on public.bingo_tasks(event_id);
create index if not exists idx_treasure_hunt_event on public.treasure_hunt(event_id);
create index if not exists idx_challenges_event on public.challenges(event_id);
create index if not exists idx_live_messages_event on public.live_messages(event_id);
create index if not exists idx_shop_purchases_event on public.shop_purchases(event_id);
create index if not exists idx_points_history_event on public.points_history(event_id);

-- Optional: app settings helpers
create or replace function public.set_event_context(p_event_id uuid)
returns void language sql as $$
  select set_config('app.event_id', coalesce(p_event_id::text, ''), true);
$$;

-- Note: RLS policies will be added in a subsequent migration to avoid disrupting current flows

