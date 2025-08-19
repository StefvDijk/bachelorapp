# DRINKING: Drinking Penalty System (Premium) — Uitvoerbare Specificatie

## Doel
Automatisch drankstraf bij puntenverlies boven drempel.

## Data Model (SQL)
```sql
create table if not exists public.penalty_settings (
  event_id uuid primary key,
  threshold int not null default 20,
  penalty_type text not null default 'shot',
  grace_period_minutes int not null default 5
);
create table if not exists public.drinking_penalties (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  penalty_type text not null,
  points_lost int not null,
  triggered_at timestamptz default now(),
  completed_at timestamptz,
  exempted boolean default false,
  reason text
);
```

## Edge
- `penalties_monitor` (cron): leest points_history, triggert penalties
- `penalty_complete` / `penalty_exempt`

## Acceptance
- Trigger alleen bij net verlies boven threshold en na grace period.

## Tests
- TC1 Verlies < threshold → geen penalty.
- TC2 Exempt markeert exempted=true.
