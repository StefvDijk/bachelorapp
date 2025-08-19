# ECONOMICS: Auction House (Premium) — Uitvoerbare Specificatie

## Doel
Veilingen van privileges met live biedingen en winnaars.

## Data Model (SQL)
```sql
create table if not exists public.auctions (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  item_name text not null,
  description text,
  starting_bid int not null,
  current_bid int not null default 0,
  highest_bidder_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','open','closed','cancelled'))
);
create table if not exists public.auction_bids (
  id bigint generated always as identity primary key,
  auction_id bigint references public.auctions(id) on delete cascade,
  session_id uuid not null,
  bid_amount int not null,
  placed_at timestamptz default now()
);
```

## Edge
- `open_auction`, `place_bid`, `close_auction`

## Acceptance
- Bieding moet hoger zijn dan current_bid en saldo toereikend.

## Tests
- TC1 Concurrent bids → hoogste wint; losers unlock funds.
