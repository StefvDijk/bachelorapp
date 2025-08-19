# CORE: Bingo 5×5 — Uitvoerbare Specificatie

## Doel
Spelers voltooien 25 opdrachten in een 5×5 grid, verdienen basispunten en bonussen (kleur/rij/kolom/sterren). Foto-bewijs vereist.

## Data Model (SQL)
```sql
-- Tables
create table if not exists public.bingo_tasks (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  position smallint not null check (position between 0 and 24),
  title text not null,
  description text,
  completed boolean not null default false,
  completed_at timestamptz,
  photo_url text,
  points smallint not null default 20,
  created_at timestamptz default now()
);

create index if not exists bingo_tasks_event_session_idx on public.bingo_tasks(event_id, session_id);
create unique index if not exists bingo_tasks_unique_cell on public.bingo_tasks(event_id, session_id, position);

create table if not exists public.bingo_colors (
  event_id uuid primary key,
  color_map jsonb not null -- {"0":"#ec4899",..."4":"#34d399"}
);

-- Bonus state (optional, for analytics)
create table if not exists public.bingo_bonus_audits (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  type text not null check (type in ('four_same_color','five_same_color','row','column','five_stars')),
  points_awarded int not null,
  created_at timestamptz default now()
);
```

## RLS Policies (per event/session)
```sql
alter table public.bingo_tasks enable row level security;

-- App context: set via rpc set_session_context(session_id uuid)
create or replace function public.set_session_context(session_id uuid)
returns void language sql as $$ select set_config('app.session_id', session_id::text, true); $$;

-- Players read/write only own session tasks
create policy bingo_player_read on public.bingo_tasks
for select using (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
);

create policy bingo_player_update on public.bingo_tasks
for update using (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
);

-- Organizer (service role) full access by event scope handled via server key.
```

## API Endpoints (HTTP via Supabase/Postgrest)
- GET `/rest/v1/bingo_tasks?session_id=eq.{sessionId}&order=position`
- PATCH `/rest/v1/bingo_tasks?id=eq.{taskId}` body `{ completed, completed_at, photo_url }`
- POST `/rest/v1/bingo_tasks` body 25 rows for initialization (admin edge function)

## Edge Functions
### 1) `initialize_bingo`
Input: `{ event_id, session_id, template_tasks?: [{position,title,description,points}] }`
Logic:
- Upsert 25 rows if not present
- Apply color pattern and star positions to metadata if needed
- Return created rows

### 2) `award_bingo_bonus`
Input: `{ event_id, session_id }`
Logic:
- Fetch all 25 tasks for session
- Compute bonuses:
  - Rows/columns complete (first occurrence only per session)
  - Four/five same color counts (map positions->colors)
  - Five stars complete
- Calculate delta points vs previous audit
- Insert `bingo_bonus_audits` entries for new awards
- Call `add_points(event_id, session_id, delta)` (points manager)

## Points Calculation
- Base: each completed task = `points` (default 20)
- Bonuses:
  - 4× same color: +30
  - 5× same color: +25
  - First full row: +35
  - First full column: +35
  - 5 stars: +50

## Acceptance Criteria
1. Init: Bij start bestaan 25 cellen met correcte posities (0..24) en titels.
2. Complete: Bij upload foto en markeren `completed=true` wordt `completed_at` gevuld.
3. Bonus: Bij het afronden van de vijfde ster wordt automatisch +50 toegekend (audit record + points saldo).
4. Row/Column: Alleen de eerste volledige rij/kolom per sessie kent +35 toe.
5. Colors: Kleur-bonussen worden berekend o.b.v. vaste pattern mapping (documented in code).
6. Security: Speler kan alleen eigen `session_id`-rijen muteren; organizer kan seeden/resetten.
7. Offline: Foto-upload queued indien offline; completion wordt later gesynchroniseerd.

## Testcases
- TC1 Init: Aanroepen `initialize_bingo` met lege sessie creëert 25 unieke posities.
- TC2 Complete Task: PATCH completed=true → task telt mee in breakdown.
- TC3 Row Bonus: Markeer posities 0..4 → precies 1 audit record type `row`.
- TC4 Column Bonus: Markeer posities 0,5,10,15,20 → 1 audit `column`.
- TC5 Color Bonus: Markeer posities met 4× zelfde kleur → 1 audit `four_same_color`.
- TC6 Stars: Markeer posities 2,6,12,19,24 → audit `five_stars` en +50.
- TC7 Idempotent: Herhaald awarden zelfde rij/kolom levert geen extra audit.
- TC8 RLS: Speler A kan taken speler B niet lezen of schrijven.

## Frontend Integratie
- Hook `useBingo(sessionId)` laadt taken, subscribe realtime, expose `completeTaskWithPhoto(file)`.
- UI grid toont kleuren en sterposities; animaties bij completion; bonus toasts bij awards.

## Migratie/Seed
- Voeg `bingo_colors` default map toe per event (5 kleuren hex).
- Seed 25 default bingo titels uit template editor.
