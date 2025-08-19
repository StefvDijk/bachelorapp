# COMPETITION: Hall of Fame (Premium) — Uitvoerbare Specificatie

## Doel
Automatisch highlights vastleggen en presenteren; exporteerbaar.

## Data Model (SQL)
```sql
create table if not exists public.hall_of_fame_moments (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  moment_type text not null,
  title text,
  description text,
  media_urls jsonb not null default '[]'::jsonb,
  votes int not null default 0,
  auto_captured boolean default false,
  timestamp timestamptz,
  featured boolean default false
);
create table if not exists public.moment_votes (
  id bigint generated always as identity primary key,
  moment_id bigint references public.hall_of_fame_moments(id) on delete cascade,
  session_id uuid not null,
  voted_at timestamptz default now(),
  unique(moment_id, session_id)
);
```

## Edge
- `capture_moment` (hooks op uploads/completions)
- `export_hof` (PDF/Video manifest)

## Acceptance
- Auto-capture drempels ingesteld (bijv. 5 likes in 2 min).

## Tests
- TC1 Capture bij drempel.
- TC2 Export manifest bevat alle media urls.
