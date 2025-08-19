-- CORE Features Database Schemas
-- Based on feature specifications in docs/features/

-- ============================================================================
-- CORE: Bingo (already exists, but ensure complete schema)
-- ============================================================================

-- Bingo colors configuration per event
create table if not exists public.bingo_colors (
  event_id uuid primary key references public.events(id) on delete cascade,
  color_map jsonb not null default '{
    "0": "#ec4899", "1": "#f59e0b", "2": "#10b981", "3": "#3b82f6", "4": "#8b5cf6",
    "5": "#ec4899", "6": "#f59e0b", "7": "#10b981", "8": "#3b82f6", "9": "#8b5cf6",
    "10": "#ec4899", "11": "#f59e0b", "12": "#10b981", "13": "#3b82f6", "14": "#8b5cf6",
    "15": "#ec4899", "16": "#f59e0b", "17": "#10b981", "18": "#3b82f6", "19": "#8b5cf6",
    "20": "#ec4899", "21": "#f59e0b", "22": "#10b981", "23": "#3b82f6", "24": "#8b5cf6"
  }'::jsonb,
  created_at timestamptz default now()
);

-- Bingo bonus tracking for awards
create table if not exists public.bingo_bonus_audits (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  bonus_type text not null check (bonus_type in ('four_same_color','five_same_color','row','column','five_stars')),
  points_awarded int not null,
  created_at timestamptz default now()
);

create index if not exists idx_bingo_bonus_audits_event_session on public.bingo_bonus_audits(event_id, session_id);

-- ============================================================================
-- CORE: Deal Shop
-- ============================================================================

-- Shop items available per event
create table if not exists public.shop_items (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  price int not null,
  category text not null check (category in ('gameplay', 'points', 'help', 'social', 'risk')),
  stock_limit int, -- null = unlimited
  effects_json jsonb default '{}', -- {"type": "point_multiplier", "value": 1.5, "duration": 3600}
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_shop_items_event on public.shop_items(event_id);
create index if not exists idx_shop_items_active on public.shop_items(event_id, active);

-- ============================================================================
-- CORE: Simply Wild (Gambling)
-- ============================================================================

-- Gambling sessions for tracking bets and results
create table if not exists public.gambling_sessions (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  bet_amount int not null,
  result text not null, -- 'win', 'lose', 'jackpot'
  winnings int not null default 0,
  played_at timestamptz default now(),
  game_type text not null default 'slots'
);

-- Jackpot pool per event
create table if not exists public.jackpot_pool (
  event_id uuid primary key references public.events(id) on delete cascade,
  current_amount int not null default 0,
  last_winner_session_id uuid references public.sessions(id),
  last_won_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists idx_gambling_sessions_event on public.gambling_sessions(event_id);
create index if not exists idx_gambling_sessions_session on public.gambling_sessions(session_id);

-- ============================================================================
-- CORE: Spectator View
-- ============================================================================

-- Spectator access tokens for public viewing
create table if not exists public.spectator_tokens (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Track spectator views for analytics
create table if not exists public.spectator_views (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  token_id bigint references public.spectator_tokens(id),
  viewer_ip text,
  viewed_at timestamptz default now()
);

create index if not exists idx_spectator_tokens_event on public.spectator_tokens(event_id);
create index if not exists idx_spectator_tokens_token on public.spectator_tokens(token) where active = true;
create index if not exists idx_spectator_views_event on public.spectator_views(event_id);

-- ============================================================================
-- RLS Policies for CORE Features
-- ============================================================================

-- Bingo colors (read-only for players, full access for admins)
alter table public.bingo_colors enable row level security;

create policy bingo_colors_player_read on public.bingo_colors
for select using (
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

-- Bingo bonus audits (read own session)
alter table public.bingo_bonus_audits enable row level security;

create policy bingo_bonus_audits_player_read on public.bingo_bonus_audits
for select using (
  current_setting('app.session_id', true) is not null and 
  session_id = current_setting('app.session_id', true)::uuid
);

-- Shop items (read-only for players)
alter table public.shop_items enable row level security;

create policy shop_items_player_read on public.shop_items
for select using (
  active = true and
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

-- Gambling sessions (own session only)
alter table public.gambling_sessions enable row level security;

create policy gambling_sessions_player_manage on public.gambling_sessions
for all using (
  current_setting('app.session_id', true) is not null and 
  session_id = current_setting('app.session_id', true)::uuid
);

-- Jackpot pool (read-only for players)
alter table public.jackpot_pool enable row level security;

create policy jackpot_pool_player_read on public.jackpot_pool
for select using (
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

-- Spectator tokens (public read for active tokens)
alter table public.spectator_tokens enable row level security;

create policy spectator_tokens_public_read on public.spectator_tokens
for select using (active = true and (expires_at is null or expires_at > now()));

-- Spectator views (insert only for tracking)
alter table public.spectator_views enable row level security;

create policy spectator_views_insert on public.spectator_views
for insert with check (true); -- Allow anonymous inserts for view tracking

-- ============================================================================
-- Default Data Setup
-- ============================================================================

-- Insert default bingo colors for legacy event
insert into public.bingo_colors (event_id)
select id from public.events where slug = 'legacy'
on conflict (event_id) do nothing;

-- Insert default shop items for legacy event
do $$
declare
  legacy_event_id uuid;
begin
  select id into legacy_event_id from public.events where slug = 'legacy' limit 1;
  
  if legacy_event_id is not null then
    insert into public.shop_items (event_id, name, description, price, category) values
    (legacy_event_id, 'Extra Hint', 'Krijg een extra hint voor een treasure hunt locatie', 50, 'help'),
    (legacy_event_id, 'Point Multiplier', 'Volgende 3 voltooide taken geven dubbele punten', 100, 'points'),
    (legacy_event_id, 'Skip Task', 'Sla een moeilijke bingo taak over', 75, 'gameplay'),
    (legacy_event_id, 'Steal Points', 'Steel 25 punten van een andere speler', 150, 'social'),
    (legacy_event_id, 'Mystery Box', '50% kans op 200 punten, 50% kans om 50 punten te verliezen', 100, 'risk')
    on conflict do nothing;
  end if;
end $$;

-- Initialize jackpot pool for legacy event
insert into public.jackpot_pool (event_id, current_amount)
select id, 500 from public.events where slug = 'legacy'
on conflict (event_id) do nothing;
