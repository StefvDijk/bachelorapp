# CORE: Deal Maker's Shop — Uitvoerbare Specificatie

## Doel
Spelers besteden punten aan strategische voordelen (skips, hints, boosters) via een in-app shop.

## Data Model (SQL)
```sql
create table if not exists public.shop_items (
  id text primary key,
  event_id uuid not null,
  name text not null,
  description text,
  price int not null,
  category text not null check (category in ('gameplay','points','help','social','risk')),
  stock_limit int,
  effects jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table if not exists public.shop_purchases (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  item_id text references public.shop_items(id),
  price int not null,
  purchased_at timestamptz default now(),
  used boolean not null default false,
  used_at timestamptz
);

create index if not exists shop_purchases_event_session_idx on public.shop_purchases(event_id, session_id);
```

## RLS Policies
```sql
alter table public.shop_items enable row level security;
create policy shop_items_public_read on public.shop_items for select using (active);

alter table public.shop_purchases enable row level security;
create policy shop_purchases_owner on public.shop_purchases for all using (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
) with check (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
);
```

## API Endpoints
- GET `/rest/v1/shop_items?event_id=eq.{eventId}&active=is.true`
- POST `/rest/v1/shop_purchases` `{ session_id, item_id, price }`
- PATCH `/rest/v1/shop_purchases?id=eq.{id}` `{ used=true, used_at=now() }`

## Edge Functions
### `purchase_item`
- Input: `{ event_id, session_id, item_id }`
- Validaties: saldo, stock, active
- Transacties: punten aftrekken, aankoop schrijven, stock verlagen, effect toepassen

### `apply_item_effect`
- Interpreteert `effects` JSON, bijv. `{ "type":"skip_task" }`, `{ "type":"points_boost","multiplier":2, "duration":1}`

## Acceptance Criteria
1. Aankoop faalt bij onvoldoende punten; slaagt anders en verlaagt saldo.
2. Items met stock_limit=0 kunnen niet gekocht worden; bij null = onbeperkt.
3. Effecten worden toegepast op gameplay (skip, boost) en zijn traceerbaar.
4. Gebruiker ziet aankoopgeschiedenis; `used` status wordt correct gezet.

## Testcases
- TC1 Koop met voldoende punten → success; saldo vermindert.
- TC2 Koop met onvoldoende punten → foutmelding.
- TC3 Stock op → aankoop blokkeert.
- TC4 Effect skip → volgende task kan zonder foto worden afgerond 1×.

## Frontend Integratie
- Hook `useShop(eventId, sessionId)` met `purchase(itemId)` en `usePurchase(purchaseId)`.
- UI: grid van items, detail modal, confirm dialogs, history list.
