# COMPETITION: MVP Voting — Uitvoerbare Specificatie

## Doel
Meerdere rondes stemmen op spelers per categorie met beloning.

## Data Model (SQL)
```sql
create table if not exists public.mvp_voting_rounds (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  round_number int not null,
  category text not null,
  status text not null default 'open' check (status in ('open','closed')),
  ends_at timestamptz
);
create table if not exists public.mvp_votes (
  id bigint generated always as identity primary key,
  round_id bigint references public.mvp_voting_rounds(id) on delete cascade,
  voter_session_id uuid not null,
  nominee_session_id uuid not null,
  voted_at timestamptz default now(),
  unique(round_id, voter_session_id)
);
create table if not exists public.mvp_winners (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  category text not null,
  votes_received int not null,
  round_number int not null,
  created_at timestamptz default now()
);
```

## Edge
- `open_round`, `close_round_and_compute_winner`, `cast_vote`

## Acceptance
- Eén stem per ronde per voter.
- Bij sluiten wordt winnaar berekend en beloond (points add).

## Tests
- TC1 Dubbele stem → 409.
- TC2 Geen stemmen → geen winnaar.

## Frontend
- Ronde UI met timer, categorie tabs, kandidaatselectie, resultaat.
