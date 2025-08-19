# LOCATION: Bar Crawl Route — Uitvoerbare Specificatie

## Doel
Geoptimaliseerde route langs bars met tijdsplanning en voortgang.

## Data Model (SQL)
```sql
create table if not exists public.bar_crawl_locations (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  time_allocation_minutes int not null default 45,
  order_index int not null,
  forced_order boolean default true
);
create table if not exists public.bar_crawl_visits (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  location_id bigint references public.bar_crawl_locations(id) on delete cascade,
  arrived_at timestamptz,
  left_at timestamptz
);
```

## RLS
```sql
alter table public.bar_crawl_locations enable row level security;
create policy bcl_public_read on public.bar_crawl_locations for select using (true);

alter table public.bar_crawl_visits enable row level security;
create policy bcv_owner on public.bar_crawl_visits for all using (
  current_setting('app.session_id', true) = session_id::text
) with check (
  current_setting('app.session_id', true) = session_id::text
);
```

## Edge
- `optimize_route` (geocoding + TSP-lite)
- `arrive_location`/`leave_location`

## Acceptance
- Forced order afdwingbaar; progressie zichtbaar.

## Tests
- TC1 Optimize zet volgorde.
- TC2 Arrive/leave logt tijden.
