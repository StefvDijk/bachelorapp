# PARTY: Wedding Countdown — Uitvoerbare Specificatie

## Doel
Aftellen naar de trouwdatum met configureerbare stijl en milestones.

## Data Model (SQL)
```sql
create table if not exists public.wedding_countdown (
  event_id uuid primary key,
  wedding_date date not null,
  message_template text default 'Days until the big day!',
  style text not null default 'digital' check (style in ('digital','analog','flip')),
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);
```

## RLS
```sql
alter table public.wedding_countdown enable row level security;
create policy wc_public_read on public.wedding_countdown for select using (true);
-- writes via organizer (service role) of via admin UI edge endpoint
```

## Edge
- `set_wedding_countdown` `{ event_id, wedding_date, style, message_template, milestones }`

## Acceptance
- Countdown werkt client-side en is timezone-safe.
- Milestones triggeren een visuele celebratie.

## Tests
- TC1 D-waarde klopt voor verschillende tijdzones.
- TC2 Flip/analog/digital renderen correct.

## Frontend
- Component `<WeddingCountdown />` met props uit DB; animaties bij milestones.
