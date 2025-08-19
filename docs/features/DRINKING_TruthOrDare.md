# DRINKING: Truth or Dare — Uitvoerbare Specificatie

## Doel
Spelers kiezen Truth/Dare; uitdagingen worden gelogd en eventueel met foto-bewijs.

## Data Model (SQL)
```sql
create table if not exists public.tod_content (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  type text not null check (type in ('truth','dare')),
  content text not null,
  difficulty text not null check (difficulty in ('mild','medium','spicy')),
  active boolean default true
);
create table if not exists public.tod_sessions (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  content_id bigint references public.tod_content(id),
  choice text not null check (choice in ('truth','dare')),
  completed boolean default false,
  photo_url text,
  created_at timestamptz default now()
);
```

## Edge
- `tod_random_content` (met filters), `tod_complete`

## Acceptance
- Difficulty- en typefiltering werkt.
- Foto vereist voor dare (instelbaar).

## Tests
- TC1 Random met filters levert content.
- TC2 Complete markeert en optioneel foto URL.
