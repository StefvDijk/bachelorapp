# CORE: Photo Wall — Uitvoerbare Specificatie

## Doel
Centrale live foto-feed per event, met compressie, moderatie, likes en downloads.

## Data Model (SQL)
```sql
create table if not exists public.photos (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  url text not null,
  thumbnail_url text,
  caption text,
  likes int not null default 0,
  approved boolean not null default true,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.photo_reactions (
  id bigint generated always as identity primary key,
  photo_id bigint references public.photos(id) on delete cascade,
  session_id uuid not null,
  reaction_type text not null check (reaction_type in ('like','heart','lol','wow')),
  created_at timestamptz default now(),
  unique(photo_id, session_id, reaction_type)
);
```

## RLS Policies
```sql
alter table public.photos enable row level security;
create policy photos_player_read on public.photos for select using (true);
create policy photos_player_insert on public.photos for insert with check (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
);
```

## Storage
- Bucket: `bingo-photos` (bestaat al) of `party-photos/{event_id}`
- Thumbnails genereren client-side (Canvas) of Edge Function

## API Endpoints
- GET `/rest/v1/photos?event_id=eq.{eventId}&order=created_at.desc&limit=50`
- POST `/rest/v1/photos` `{ session_id, url, thumbnail_url, caption, metadata }`
- POST `/rest/v1/photo_reactions` `{ photo_id, session_id, reaction_type }`

## Edge Functions
### `ingest_photo`
- Input: `{ event_id, session_id, base64, caption }`
- Compress, upload, create DB record, return urls

### `moderate_photo`
- Input: `{ photo_id, approved }` (admin)
- Update approval state

## Acceptance Criteria
1. Foto upload werkt online/offline; bij offline queued action wordt later geüpload.
2. Foto verschijnt in feed met thumbnail binnen 2s (optimistic UI toegestaan).
3. Likes/reactions zijn uniek per gebruiker per type.
4. Moderatie kan foto’s verbergen zonder verwijderen.
5. Download ZIP van alle foto’s (admin) mogelijk.

## Testcases
- TC1 Upload: Base64 → opslag → DB record met urls.
- TC2 Reaction: dubbele like door dezelfde user wordt voorkomen.
- TC3 Moderation: approved=false verbergt foto in feed.
- TC4 Pagination: bij scrollen nieuwe batch.

## Frontend Integratie
- Hook `usePhotoWall(eventId)` expose `uploadPhoto(file|base64, caption)` en `react(photoId, type)`.
- UI masonry grid, fullscreen viewer, like-animaties, share.
