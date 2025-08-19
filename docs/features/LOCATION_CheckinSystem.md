# LOCATION: Check-in System — Uitvoerbare Specificatie

## Doel
Check-ins via QR/GPS/Photo met bonussen per locatie.

## Data Model (SQL)
```sql
create table if not exists public.checkin_locations (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  name text not null,
  qr_code text,
  latitude double precision,
  longitude double precision,
  radius_meters int default 50,
  bonus_points int default 10
);
create table if not exists public.checkins (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  location_id bigint references public.checkin_locations(id) on delete cascade,
  method text not null check (method in ('qr','gps','photo')),
  verified_at timestamptz,
  bonus_awarded boolean default false
);
```

## Edge
- `verify_checkin` → valideert methode en kent bonus toe

## Acceptance
- GPS radius en QR exactheid; photo proof optioneel met review.
