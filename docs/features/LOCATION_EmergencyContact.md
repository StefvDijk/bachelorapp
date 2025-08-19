# LOCATION: Emergency Contact — Uitvoerbare Specificatie

## Doel
Snel alarm versturen met (optioneel) live locatie naar organizers.

## Data Model (SQL)
```sql
create table if not exists public.emergency_contacts (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  name text not null,
  phone text,
  role text,
  priority smallint default 1
);
create table if not exists public.emergency_alerts (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  alert_type text not null,
  location_lat double precision,
  location_lng double precision,
  message text,
  status text not null default 'open' check (status in ('open','ack','resolved')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);
```

## Edge
- `send_emergency_alert` → notificaties (SMS/email/push), status updates

## Acceptance
- Alert zichtbaar in admin; status-updates en sluiting gelogd.
