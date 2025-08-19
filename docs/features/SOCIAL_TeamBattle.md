# SOCIAL: Team Battle Mode — Uitvoerbare Specificatie

## Doel
Teams strijden tegen elkaar met team-based punten en challenges.

## Data Model (SQL)
```sql
create table if not exists public.teams (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  name text not null,
  color text,
  captain_session_id uuid,
  total_points int not null default 0
);
create table if not exists public.team_members (
  id bigint generated always as identity primary key,
  team_id bigint references public.teams(id) on delete cascade,
  session_id uuid not null,
  role text default 'member',
  joined_at timestamptz default now(),
  unique(team_id, session_id)
);
```

## Edge
- `create_teams` `{ event_id, teams: [{name,color,players:[]}] }`
- `assign_player` `{ team_id, session_id }`
- `add_team_points` `{ team_id, delta }`

## Acceptance
- Team points reflecteren som van individuele + bonuses.

## Tests
- TC1 Create 2 teams → leden toegewezen.
- TC2 Add points → total_points verhoogt.
