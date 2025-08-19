# MEDIA: Playlist Control — Uitvoerbare Specificatie

## Doel
Collaboratieve playlist met voting en auto-DJ mode.

## Data Model (SQL)
```sql
create table if not exists public.playlist_songs (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  external_id text not null,
  title text,
  artist text,
  added_at timestamptz default now(),
  votes int not null default 0,
  played boolean default false
);
create table if not exists public.song_votes (
  id bigint generated always as identity primary key,
  song_id bigint references public.playlist_songs(id) on delete cascade,
  session_id uuid not null,
  vote_type text default 'up',
  voted_at timestamptz default now(),
  unique(song_id, session_id)
);
```

## Edge
- `add_song`, `vote_song`, `next_song_auto_dj`

## Acceptance
- Upvote éénmaal per song; auto-DJ kiest hoogste score/vers spreiding.

## Tests
- TC1 Dubbele vote geblokkeerd.
- TC2 Auto-DJ selecteert niet recent gespeelde song.
