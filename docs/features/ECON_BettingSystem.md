# ECONOMICS: Betting System (Premium) — Uitvoerbare Specificatie

## Doel
Wedden met punten op uitkomsten (markten) met house edge en uitbetalingen.

## Data Model (SQL)
```sql
create table if not exists public.betting_markets (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  market_type text not null,
  description text,
  odds jsonb not null, -- {"A":1.8,"B":2.1}
  closes_at timestamptz,
  resolved boolean default false,
  winning_outcome text
);
create table if not exists public.bets (
  id bigint generated always as identity primary key,
  market_id bigint references public.betting_markets(id) on delete cascade,
  session_id uuid not null,
  bet_amount int not null,
  predicted_outcome text not null,
  odds numeric not null,
  potential_payout int not null,
  placed_at timestamptz default now(),
  resolved boolean default false,
  payout int
);
```

## Edge
- `place_bet`, `resolve_market`

## Acceptance
- Bets na sluiting geweigerd; uitbetaling = bet*odds (naar beneden afgerond).

## Tests
- TC1 Place bet → lock saldo; resolve → correct payout.
