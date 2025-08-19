# DRINKING: Shot Roulette — Uitvoerbare Specificatie

## Doel
Draai het wiel, drink het resultaat, verdien/verlies punten.

## Data Model (SQL)
```sql
create table if not exists public.shot_types (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  name text not null,
  probability_weight int not null default 1,
  active boolean not null default true
);

create table if not exists public.shot_roulette_spins (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  shot_type_id bigint references public.shot_types(id),
  cost int not null,
  reward int not null,
  spun_at timestamptz default now()
);
```

## RLS Policies
```sql
alter table public.shot_types enable row level security;
create policy shot_types_public on public.shot_types for select using (active);

alter table public.shot_roulette_spins enable row level security;
create policy spins_owner on public.shot_roulette_spins for select using (
  current_setting('app.session_id', true) = session_id::text
);
```

## API / Edge
- `spin_shot_roulette`: Input `{ event_id, session_id }` → select weighted shot, deduct cost, add reward, log spin.

## Acceptance Criteria
- Kosten/reward worden correct toegepast.
- Weighted randomness volgt `probability_weight`.

## Testcases
- TC1 Geen actieve types → 400.
- TC2 Spin → logregel + saldo mutaties.
