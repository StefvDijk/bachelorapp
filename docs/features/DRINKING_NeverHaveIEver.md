# DRINKING: Never Have I Ever — Uitvoerbare Specificatie

## Doel
Vragenronde met puntenverdeling op basis van antwoorden.

## Data Model (SQL)
```sql
create table if not exists public.nhie_questions (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  text text not null,
  active boolean default true
);
create table if not exists public.nhie_games (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  status text not null default 'draft' check (status in ('draft','active','completed')),
  round_number int not null default 0
);
create table if not exists public.nhie_responses (
  id bigint generated always as identity primary key,
  game_id bigint references public.nhie_games(id) on delete cascade,
  session_id uuid not null,
  question_id bigint references public.nhie_questions(id),
  response boolean not null,
  points_earned int not null default 0
);
```

## Edge
- `start_nhie_game`, `next_question`, `submit_response` (berekent punten)

## Acceptance
- Volgorde vragen random; iedere response één keer per speler.

## Tests
- TC1 Start → status active.
- TC2 Submit dubbel → geblokkeerd.
