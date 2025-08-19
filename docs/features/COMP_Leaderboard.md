# COMPETITION: Real-time Leaderboard — Uitvoerbare Specificatie

## Doel
Live rankings per categorie (punten, foto’s, challenges) met real-time updates.

## Data Model (SQL)
```sql
create table if not exists public.leaderboard_entries (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  category text not null,
  score int not null,
  rank int,
  updated_at timestamptz default now()
);
create index if not exists lbe_event_category_idx on public.leaderboard_entries(event_id, category);
```

## RLS
```sql
alter table public.leaderboard_entries enable row level security;
create policy lbe_public_read on public.leaderboard_entries for select using (true);
-- writes via Edge Functions / service role
```

## API Endpoints
- GET `/rest/v1/leaderboard_entries?event_id=eq.{eventId}&category=eq.{cat}&order=rank.asc&limit=20`

## Edge Functions
### `compute_leaderboard`
- Aggregates: points_balance, photos_count, challenges_completed
- Writes top N per category into `leaderboard_entries`
- Schedules every 10–30s (configurable)

## Acceptance Criteria
1. Top N per categorie wordt binnen 1 minuut geüpdatet.
2. Rank verandert atomair (geen dubbele rangen).

## Testcases
- TC1 Geen spelers → lege lijst.
- TC2 Ties → stabiele sort (session_id tiebreaker).
- TC3 Frequent updates blijven performant (<200ms voor 100 spelers).

## Frontend Integratie
- Hook `useLeaderboard(eventId, category)` → subscribe op tabel; render top.
