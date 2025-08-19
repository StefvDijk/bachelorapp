# SOCIAL: Memory Lane — Uitvoerbare Specificatie

## Doel
Oude foto's/herinneringen per periode delen met stemmen.

## Data Model (SQL)
```sql
create table if not exists public.memories (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  title text,
  description text,
  photo_url text not null,
  time_period text,
  category text,
  votes int not null default 0,
  uploaded_at timestamptz default now()
);
create table if not exists public.memory_votes (
  id bigint generated always as identity primary key,
  memory_id bigint references public.memories(id) on delete cascade,
  session_id uuid not null,
  voted_at timestamptz default now(),
  unique(memory_id, session_id)
);
```

## Edge
- `submit_memory`, `vote_memory`
