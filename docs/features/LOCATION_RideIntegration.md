# LOCATION: Ride Integration — Uitvoerbare Specificatie

## Doel
Groepsritten plannen met kostenverdeling (Uber/Lyft/Taxi APIs).

## Data Model (SQL)
```sql
create table if not exists public.ride_requests (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  organizer_session_id uuid not null,
  pickup_location text,
  destination text,
  participants jsonb not null default '[]'::jsonb,
  total_cost int,
  status text not null default 'requested' check (status in ('requested','accepted','in_progress','completed','cancelled')),
  provider text,
  external_trip_id text
);
create table if not exists public.ride_participants (
  id bigint generated always as identity primary key,
  ride_id bigint references public.ride_requests(id) on delete cascade,
  session_id uuid not null,
  cost_share int default 0,
  paid boolean default false
);
```

## Edge
- `request_ride`, `update_ride_status`, `split_costs`

## Acceptance
- Kosten splitsing klopt op totaal; statusflow consistent.
