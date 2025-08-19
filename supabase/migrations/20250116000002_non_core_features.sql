-- Non-CORE Features Database Schemas
-- Proof of concept for extensible feature system

-- ============================================================================
-- SOCIAL: Team Battle Mode
-- ============================================================================

-- Teams per event
create table if not exists public.teams (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  captain_session_id uuid references public.sessions(id),
  total_points int not null default 0,
  created_at timestamptz default now()
);

-- Team memberships
create table if not exists public.team_members (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  joined_at timestamptz default now(),
  role text default 'member' check (role in ('captain', 'member')),
  unique(team_id, session_id)
);

-- Inter-team challenges
create table if not exists public.team_challenges (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  challenger_team_id bigint not null references public.teams(id),
  challenged_team_id bigint not null references public.teams(id),
  challenge_type text not null,
  description text,
  points_reward int not null default 100,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'completed', 'cancelled')),
  winner_team_id bigint references public.teams(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_teams_event on public.teams(event_id);
create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_session on public.team_members(session_id);
create index if not exists idx_team_challenges_event on public.team_challenges(event_id);

-- ============================================================================
-- COMPETITION: Leaderboard
-- ============================================================================

-- Leaderboard entries with different categories
create table if not exists public.leaderboard_entries (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  category text not null default 'overall', -- 'overall', 'bingo', 'treasure', 'social', etc.
  score int not null default 0,
  rank int not null default 1,
  updated_at timestamptz default now(),
  unique(event_id, session_id, category)
);

-- Historical leaderboard snapshots for tracking changes
create table if not exists public.leaderboard_history (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  category text not null,
  score int not null,
  rank int not null,
  timestamp timestamptz default now()
);

create index if not exists idx_leaderboard_entries_event_category on public.leaderboard_entries(event_id, category, rank);
create index if not exists idx_leaderboard_entries_session on public.leaderboard_entries(session_id);
create index if not exists idx_leaderboard_history_event on public.leaderboard_history(event_id, timestamp);

-- ============================================================================
-- MEDIA: Story Mode
-- ============================================================================

-- Stories that expire after 24 hours (like Instagram stories)
create table if not exists public.stories (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  views_count int not null default 0
);

-- Story views tracking
create table if not exists public.story_views (
  id bigint generated always as identity primary key,
  story_id bigint not null references public.stories(id) on delete cascade,
  viewer_session_id uuid not null references public.sessions(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique(story_id, viewer_session_id)
);

create index if not exists idx_stories_event on public.stories(event_id);
create index if not exists idx_stories_active on public.stories(event_id, expires_at) where expires_at > now();
create index if not exists idx_story_views_story on public.story_views(story_id);

-- ============================================================================
-- RLS Policies for Non-CORE Features
-- ============================================================================

-- Teams (read for event participants, manage for captains)
alter table public.teams enable row level security;

create policy teams_event_read on public.teams
for select using (
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

-- Team members (read for team members, insert for joining)
alter table public.team_members enable row level security;

create policy team_members_read on public.team_members
for select using (
  current_setting('app.session_id', true) is not null and 
  (session_id = current_setting('app.session_id', true)::uuid or
   team_id in (
     select team_id from public.team_members 
     where session_id = current_setting('app.session_id', true)::uuid
   ))
);

create policy team_members_join on public.team_members
for insert with check (
  current_setting('app.session_id', true) is not null and 
  session_id = current_setting('app.session_id', true)::uuid
);

-- Team challenges (read for event participants)
alter table public.team_challenges enable row level security;

create policy team_challenges_event_read on public.team_challenges
for select using (
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

-- Leaderboard entries (read-only for participants)
alter table public.leaderboard_entries enable row level security;

create policy leaderboard_entries_event_read on public.leaderboard_entries
for select using (
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

-- Leaderboard history (read-only for participants)
alter table public.leaderboard_history enable row level security;

create policy leaderboard_history_event_read on public.leaderboard_history
for select using (
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

-- Stories (read active stories, manage own stories)
alter table public.stories enable row level security;

create policy stories_event_read on public.stories
for select using (
  expires_at > now() and
  current_setting('app.session_id', true) is not null and 
  event_id in (
    select event_id from public.sessions 
    where id = current_setting('app.session_id', true)::uuid
  )
);

create policy stories_own_manage on public.stories
for all using (
  current_setting('app.session_id', true) is not null and 
  session_id = current_setting('app.session_id', true)::uuid
);

-- Story views (insert for tracking views)
alter table public.story_views enable row level security;

create policy story_views_track on public.story_views
for insert with check (
  current_setting('app.session_id', true) is not null and 
  viewer_session_id = current_setting('app.session_id', true)::uuid
);

create policy story_views_read on public.story_views
for select using (
  current_setting('app.session_id', true) is not null and 
  story_id in (
    select id from public.stories 
    where session_id = current_setting('app.session_id', true)::uuid
  )
);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update leaderboard rankings
create or replace function public.update_leaderboard_rankings(p_event_id uuid, p_category text default 'overall')
returns void language plpgsql as $$
begin
  -- Update rankings based on score
  with ranked_entries as (
    select 
      id,
      rank() over (order by score desc) as new_rank
    from public.leaderboard_entries 
    where event_id = p_event_id and category = p_category
  )
  update public.leaderboard_entries le
  set rank = re.new_rank
  from ranked_entries re
  where le.id = re.id;

  -- Insert into history for tracking
  insert into public.leaderboard_history (event_id, session_id, category, score, rank)
  select event_id, session_id, category, score, rank
  from public.leaderboard_entries
  where event_id = p_event_id and category = p_category;
end;
$$;

-- Function to clean up expired stories
create or replace function public.cleanup_expired_stories()
returns void language plpgsql as $$
begin
  delete from public.stories where expires_at < now();
end;
$$;

-- ============================================================================
-- Default Data for Legacy Event
-- ============================================================================

-- Add some default teams for legacy event
do $$
declare
  legacy_event_id uuid;
begin
  select id into legacy_event_id from public.events where slug = 'legacy' limit 1;
  
  if legacy_event_id is not null then
    insert into public.teams (event_id, name, color) values
    (legacy_event_id, 'Team Rood', '#ef4444'),
    (legacy_event_id, 'Team Blauw', '#3b82f6'),
    (legacy_event_id, 'Team Groen', '#10b981')
    on conflict do nothing;
  end if;
end $$;
