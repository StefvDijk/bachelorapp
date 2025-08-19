# SOCIAL: Bachelor Roast — Uitvoerbare Specificatie

## Doel
Roast stories (tekst + foto) met voting; eventueel anoniem.

## Data Model (SQL)
```sql
create table if not exists public.bachelor_roasts (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid,
  category text,
  title text,
  content text not null,
  photo_url text,
  votes int not null default 0,
  anonymous boolean default true,
  approved boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.roast_votes (
  id bigint generated always as identity primary key,
  roast_id bigint references public.bachelor_roasts(id) on delete cascade,
  session_id uuid not null,
  vote_type text default 'up',
  voted_at timestamptz default now(),
  unique(roast_id, session_id)
);
```

## Edge
- `submit_roast`, `vote_roast`, `moderate_roast`

## Acceptance
- Eén stem per speler per roast.
