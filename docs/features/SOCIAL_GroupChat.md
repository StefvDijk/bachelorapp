# SOCIAL: Group Chat — Uitvoerbare Specificatie

## Doel
Real-time groepschat met emoji reacties en foto’s.

## Data Model (SQL)
```sql
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  message text,
  image_url text,
  reactions jsonb not null default '[]'::jsonb,
  sent_at timestamptz default now(),
  moderated boolean default false
);
```

## RLS
```sql
alter table public.chat_messages enable row level security;
create policy chat_read on public.chat_messages for select using (true);
create policy chat_write on public.chat_messages for insert with check (
  current_setting('app.session_id', true) = session_id::text
);
```

## Edge
- Profanity filter, image scan (optional), rate-limit per session

## Acceptance
- Bericht verschijnt realtime; dubbele reacties voorkomen via client logic.
