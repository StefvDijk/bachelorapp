# COMPETITION: Challenge Duels — Uitvoerbare Specificatie

## Doel
1-op-1 uitdagingen met timer, winnaar en bonus.

## Data Model (SQL)
```sql
create table if not exists public.duel_types (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  name text not null,
  description text,
  duration_minutes int not null default 10,
  bonus_points int not null default 30
);
create table if not exists public.duels (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  challenger_session_id uuid not null,
  challenged_session_id uuid not null,
  duel_type_id bigint references public.duel_types(id),
  status text not null default 'pending' check (status in ('pending','active','completed','cancelled')),
  winner_session_id uuid,
  started_at timestamptz,
  ended_at timestamptz
);
```

## Edge
- `start_duel`, `complete_duel`, `cancel_duel`

## Acceptance
- Alleen deelnemende spelers kunnen status wijzigen.
- Bonus toegekend aan winnaar.

## Tests
- TC1 Start → status active en timer gezet.
- TC2 Complete met winnaar → bonus bijgeschreven.
