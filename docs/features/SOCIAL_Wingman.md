# SOCIAL: Wingman System — Uitvoerbare Specificatie

## Doel
Spelers koppelen als wingmen; bonuses bij hulpacties.

## Data Model (SQL)
```sql
create table if not exists public.wingman_pairs (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  player1_session_id uuid not null,
  player2_session_id uuid not null,
  paired_at timestamptz default now(),
  active boolean default true
);
create table if not exists public.wingman_helps (
  id bigint generated always as identity primary key,
  pair_id bigint references public.wingman_pairs(id) on delete cascade,
  helper_session_id uuid not null,
  helped_session_id uuid not null,
  help_type text,
  bonus_points int not null default 0,
  helped_at timestamptz default now()
);
```

## Edge
- `pair_wingmen`, `record_help`

## Acceptance
- Cooldown en max helps per uur afdwingen via Edge.
