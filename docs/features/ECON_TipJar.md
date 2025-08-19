# ECONOMICS: Tip Jar — Uitvoerbare Specificatie

## Doel
Spelers geven punten aan elkaar als fooi met redenen.

## Data Model (SQL)
```sql
create table if not exists public.tip_reasons (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  reason_text text not null,
  category text,
  active boolean default true
);
create table if not exists public.tips (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  tipper_session_id uuid not null,
  recipient_session_id uuid not null,
  amount int not null,
  reason text,
  anonymous boolean default false,
  tipped_at timestamptz default now()
);
```

## Edge
- `send_tip` (validate balances), `list_tips`

## Acceptance
- Tipper ≠ recipient; saldo verlaagd en verhoogd correct.
