# PARTY: Bachelor Trivia — Uitvoerbare Specificatie

## Doel
Vragen over de bachelor met timer en punten per goed antwoord.

## Data Model (SQL)
```sql
create table if not exists public.trivia_questions (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  question text not null,
  correct_answer text not null,
  wrong_answers jsonb not null,
  category text,
  difficulty text,
  points int not null default 15
);
create table if not exists public.trivia_sessions (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  score int not null default 0,
  questions_answered int not null default 0,
  completed_at timestamptz
);
create table if not exists public.trivia_answers (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  question_id bigint references public.trivia_questions(id),
  answer text not null,
  correct boolean not null,
  time_taken_seconds int,
  answered_at timestamptz default now()
);
```

## Edge
- `start_trivia`, `next_trivia_question`, `submit_trivia_answer`

## Acceptance
- Score + tijdslimiet per vraag gehandhaafd; één antwoord per vraag.

## Tests
- TC1 Correct antwoord verhoogt score.
- TC2 Te late antwoorden afgekeurd.
