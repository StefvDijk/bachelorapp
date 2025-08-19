# CORE: Spectator View — Uitvoerbare Specificatie

## Doel
Publieke read-only live view met voortgang, foto-feed en leaderboard.

## Data Model (SQL)
```sql
create table if not exists public.spectator_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  token text not null unique,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.spectator_views (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  viewer_ip inet,
  viewed_at timestamptz default now()
);
```

## RLS Policies
```sql
alter table public.spectator_tokens enable row level security;
create policy spectator_admin on public.spectator_tokens for all using (false) with check (false);
-- beheer via service role (admin dashboard)
```

## Edge Functions
### `create_spectator_link`
- Input: `{ event_id, expires_in_minutes }`
- Output: `{ url, token, expires_at }`

### `spectator_summary`
- Output: `{ leaderboard, latest_photos, progress }` (samengestelde view)
- Geoptimaliseerde queries en caching

## Acceptance Criteria
1. Link werkt zonder login; alleen read-only data.
2. Token kan verlopen/geblokkeerd worden.
3. Realtime updates elke N seconden zonder zware load.

## Testcases
- TC1 Generate link → URL met token.
- TC2 Expired token → 401/403.
- TC3 Summary endpoint levert binnen <300ms voor 100 spelers.

## Frontend Integratie
- Publieke route `/spectator/{token}` rendert dashboard.
- Secties: top 5 leaderboard, recente foto’s, totale voortgang.
