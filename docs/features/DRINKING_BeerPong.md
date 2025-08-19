# DRINKING: Beer Pong Tournament — Uitvoerbare Specificatie

## Doel
Georganiseerde beer pong competitie met brackets en prijzen.

## Data Model (SQL)
```sql
create table if not exists public.beer_pong_tournaments (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  format text not null check (format in ('single_elim','round_robin','swiss')),
  teams_count int not null,
  status text not null default 'draft' check (status in ('draft','active','completed')),
  winner_team_id bigint,
  created_at timestamptz default now()
);

create table if not exists public.beer_pong_teams (
  id bigint generated always as identity primary key,
  tournament_id bigint references public.beer_pong_tournaments(id) on delete cascade,
  team_name text not null,
  players jsonb not null default '[]'::jsonb,
  eliminated boolean not null default false
);

create table if not exists public.beer_pong_matches (
  id bigint generated always as identity primary key,
  tournament_id bigint references public.beer_pong_tournaments(id) on delete cascade,
  team1_id bigint references public.beer_pong_teams(id),
  team2_id bigint references public.beer_pong_teams(id),
  winner_id bigint,
  score text,
  round int,
  played_at timestamptz
);
```

## RLS Policies
```sql
alter table public.beer_pong_tournaments enable row level security;
create policy bp_read on public.beer_pong_tournaments for select using (true);
-- writes via service role (admin)
```

## API Endpoints
- Admin: POST `/edge/beer_pong/create_tournament` `{ event_id, format, teams: [{name,players}] }`
- Admin: POST `/edge/beer_pong/report_match` `{ match_id, winner_id, score }`
- Public: GET `/rest/v1/beer_pong_matches?tournament_id=eq.{id}&order=round`

## Edge Functions
- `create_tournament`: seed teams, generate bracket, create first round matches
- `advance_bracket`: create next round based on winners
- `report_match`: validate, update winner, maybe advance bracket or set champion

## Acceptance Criteria
1. Bracket genereert correct voor gekozen format.
2. Match result verwerkt winnaar en volgende ronde.
3. Winnaar wordt opgeslagen in tournament.

## Testcases
- TC1 Create with 8 teams → 7 matches total in single_elim.
- TC2 Report invalid winner → 400.
- TC3 Completion sets champion.

## Frontend Integratie
- Admin UI: team input, bracket view, match reporting.
- Public UI: bracket viewer en live updates.
