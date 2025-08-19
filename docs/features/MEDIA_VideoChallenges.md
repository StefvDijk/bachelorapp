# MEDIA: Video Challenges — Uitvoerbare Specificatie

## Doel
Video-opnames als bewijs voor opdrachten met upload en review.

## Data Model (SQL)
```sql
create table if not exists public.video_challenges (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  challenge_id bigint,
  video_url text not null,
  duration_seconds int,
  file_size_bytes bigint,
  uploaded_at timestamptz default now(),
  approved boolean default true
);
```

## RLS
```sql
alter table public.video_challenges enable row level security;
create policy vc_owner_read on public.video_challenges for select using (
  current_setting('app.session_id', true) = session_id::text
);
create policy vc_owner_write on public.video_challenges for insert with check (
  current_setting('app.session_id', true) = session_id::text
);
```

## Edge
- `ingest_video` (compress/transcode optional), `moderate_video`

## Acceptance
- Bestanden ≤ ingest limiet; afspeelbaar op mobiel.

## Tests
- TC1 Upload→record; review toggles approved.
