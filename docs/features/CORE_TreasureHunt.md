# CORE: Treasure Hunt — Uitvoerbare Specificatie

## Doel
Spelers vinden 3–10 locaties op basis van hints/GPS/QR en verdienen punten per vondst.

## Data Model (SQL)
```sql
create table if not exists public.treasure_hunt (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  order_index smallint not null,
  location_name text not null,
  hint text,
  latitude double precision,
  longitude double precision,
  verification_method text not null default 'gps' check (verification_method in ('gps','qr','photo')),
  qr_code text,
  found boolean not null default false,
  found_at timestamptz,
  photo_url text,
  points smallint not null default 30,
  created_at timestamptz default now()
);
create index if not exists treasure_event_session_idx on public.treasure_hunt(event_id, session_id);
```

## RLS Policies
```sql
alter table public.treasure_hunt enable row level security;

create policy treasure_player_read on public.treasure_hunt
for select using (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
);

create policy treasure_player_update on public.treasure_hunt
for update using (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
);
```

## API Endpoints
- GET `/rest/v1/treasure_hunt?session_id=eq.{sessionId}&order=order_index`
- PATCH `/rest/v1/treasure_hunt?id=eq.{id}` body `{ found, found_at, photo_url }`

## Edge Functions
### `initialize_treasure`
Input: `{ event_id, session_id, locations: [{name,hint,lat,lng,method,qr,points}] }`
- Seed volgorde en methoden per locatie

### `verify_location`
Input: `{ event_id, session_id, id, method_payload }`
- GPS: check distance < radius
- QR: match code
- Photo: store and approve
- On success: mark found, add points

## Acceptance Criteria
1. Locaties laden in juiste volgorde; bij geforceerde volgorde is volgende pas zichtbaar na vondst.
2. Verificatie volgt gekozen methode; mislukte verificatie faalt met duidelijke fout.
3. Bij succes: `found=true`, tijdstempel en punten bijgeschreven.
4. Fotoverificatie vereist goedkeuring (optioneel admin) voordat punten tellen.
5. Speler kan alleen eigen sessie-locaties zien.

## Testcases
- TC1 Init: 3 locaties aangemaakt met juiste volgorde.
- TC2 GPS Verify: binnen 50m → success; buiten → fail.
- TC3 QR Verify: onjuiste code → fail; juiste → success.
- TC4 Photo Verify: upload slaat URL op; status wacht op review (indien aan).
- TC5 Security: andere sessie kan niet lezen/schrijven.

## Frontend Integratie
- Hook `useTreasure(sessionId)` met `verifyLocation(id, payload)` en realtime updates.
- UI toont afstand, hint, knop "Gevonden!", foto-capture en feedback.
