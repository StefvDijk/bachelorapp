# ECONOMICS: Point Insurance — Uitvoerbare Specificatie

## Doel
Punten beschermen tegen verlies door verzekering en claims.

## Data Model (SQL)
```sql
create table if not exists public.point_insurance (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  premium_paid int not null,
  coverage_amount int not null,
  active boolean default true,
  purchased_at timestamptz default now(),
  expires_at timestamptz
);
create table if not exists public.insurance_claims (
  id bigint generated always as identity primary key,
  insurance_id bigint references public.point_insurance(id) on delete cascade,
  claim_amount int not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  filed_at timestamptz default now(),
  processed_at timestamptz,
  payout_amount int
);
```

## Edge
- `buy_insurance`, `file_claim`, `process_claim`

## Acceptance
- Payout ≤ coverage en enkel bij approved claims.
