# PARTY: Embarrassing Stories — Uitvoerbare Specificatie

## Doel
Anoniem verhalen delen met stemmen en (optionele) moderatie.

## Data Model (SQL)
```sql
create table if not exists public.embarrassing_stories (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid,
  title text,
  content text not null,
  category text,
  anonymous boolean default true,
  votes int not null default 0,
  approved boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.story_votes (
  id bigint generated always as identity primary key,
  story_id bigint references public.embarrassing_stories(id) on delete cascade,
  voter_session_id uuid not null,
  voted_at timestamptz default now(),
  unique(story_id, voter_session_id)
);
```

## Edge
- `submit_story`, `vote_story`, `moderate_story`

## Acceptance
- Unieke stemmen; anonieme weergave zonder afzender.

## Tests
- TC1 Dubbele stem → geblokkeerd.
- TC2 Moderation approved=false verbergt verhaal publiek.
