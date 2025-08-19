# MEDIA: Story Mode — Uitvoerbare Specificatie

## Doel
Ephemeral stories (foto/video) die na X uur verdwijnen.

## Data Model (SQL)
```sql
create table if not exists public.stories (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  media_url text not null,
  caption text,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  views_count int not null default 0
);
create table if not exists public.story_views (
  id bigint generated always as identity primary key,
  story_id bigint references public.stories(id) on delete cascade,
  viewer_session_id uuid,
  viewed_at timestamptz default now(),
  unique(story_id, viewer_session_id)
);
```

## RLS
```sql
alter table public.stories enable row level security;
create policy stories_public_read on public.stories for select using (true);
create policy stories_owner_write on public.stories for insert with check (
  current_setting('app.session_id', true) = session_id::text
);
```

## Edge
- `purge_expired_stories` (cron) verwijdert/archieveert verlopen stories.

## Acceptance
- Stories verdwijnen na expires_at en tellen niet meer in feed.

## Tests
- TC1 View increments once per viewer.
- TC2 Purge verwijderd oude stories.
