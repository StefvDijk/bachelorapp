# LOCATION: Local Deals (Premium) — Uitvoerbare Specificatie

## Doel
Kortingen bij partners die unlocken via check-ins/foto’s/punten.

## Data Model (SQL)
```sql
create table if not exists public.local_deals (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  partner_name text not null,
  deal_description text not null,
  discount_percent int,
  unlock_method text not null check (unlock_method in ('checkin','photo','points')),
  expires_at timestamptz,
  max_uses int
);
create table if not exists public.deal_redemptions (
  id bigint generated always as identity primary key,
  deal_id bigint references public.local_deals(id) on delete cascade,
  session_id uuid not null,
  redeemed_at timestamptz default now(),
  location_used text
);
```

## Edge
- `unlock_deal` (controleert voorwaarde), `redeem_deal`

## Acceptance
- Expired deals niet toonbaar; max_uses geëerbiedigd.
