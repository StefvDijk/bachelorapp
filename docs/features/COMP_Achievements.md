# COMPETITION: Achievement Badges — Uitvoerbare Specificatie

## Doel
Badges ontgrendelen bij specifieke prestaties met punten en notificaties.

## Data Model (SQL)
```sql
create table if not exists public.achievements (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  name text not null,
  description text,
  icon text,
  points int not null default 25,
  difficulty text default 'normal',
  secret boolean default false,
  unlock_conditions jsonb not null default '{}'::jsonb
);
create table if not exists public.user_achievements (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  achievement_id bigint references public.achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  progress jsonb default '{}'::jsonb,
  unique(event_id, session_id, achievement_id)
);
```

## RLS
```sql
alter table public.achievements enable row level security;
create policy ach_public_read on public.achievements for select using (true);

alter table public.user_achievements enable row level security;
create policy ua_owner_read on public.user_achievements for select using (
  current_setting('app.session_id', true) = session_id::text
);
```

## Edge Functions
### `evaluate_achievements`
- Triggered on task completion/photo upload/etc.
- Checkt voorwaarden en schrijft unlocks + points.

## Acceptance
- Unlock is idempotent; dubbele unlocks niet mogelijk.

## Tests
- TC1 Voorwaarde voldaan → unlock + points add.
- TC2 Secret badge verbergt info tot unlock.

## Frontend
- Hook `useAchievements(sessionId)`; gallery view; unlock toasts.
