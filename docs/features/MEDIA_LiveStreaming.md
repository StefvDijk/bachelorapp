# MEDIA: Live Streaming (Premium) — Uitvoerbare Specificatie

## Doel
Live video stream met chat voor toeschouwers buiten het event.

## Data Model (SQL)
```sql
create table if not exists public.live_streams (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  title text,
  stream_key text not null,
  status text not null default 'offline' check (status in ('offline','live','ended')),
  viewers_count int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text
);
create table if not exists public.stream_viewers (
  id bigint generated always as identity primary key,
  stream_id bigint references public.live_streams(id) on delete cascade,
  viewer_ip inet,
  joined_at timestamptz default now(),
  left_at timestamptz
);
create table if not exists public.stream_chat (
  id bigint generated always as identity primary key,
  stream_id bigint references public.live_streams(id) on delete cascade,
  viewer_name text,
  message text not null,
  sent_at timestamptz default now()
);
```

## RLS
```sql
alter table public.live_streams enable row level security;
create policy ls_public_read on public.live_streams for select using (true);

alter table public.stream_chat enable row level security;
create policy sc_public_read on public.stream_chat for select using (true);
create policy sc_public_write on public.stream_chat for insert with check (true);
```

## Edge Functions
- `start_stream` `{ event_id, title }` → generates stream_key, set status=live.
- `end_stream` `{ stream_id }` → set ended, write recording_url.

## Acceptance
- Chat realtime zichtbaar; stream status updates live.

## Tests
- TC1 Start/End flow.
- TC2 Chat flood rate-limit via Edge.

## Frontend
- Player (HLS/WebRTC), chat pane, viewer counter.
