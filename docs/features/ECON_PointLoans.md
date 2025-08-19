# ECONOMICS: Point Loans — Uitvoerbare Specificatie

## Doel
Punten lenen met rente en terugbetalingsschema.

## Data Model (SQL)
```sql
create table if not exists public.point_loans (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  lender_session_id uuid not null,
  borrower_session_id uuid not null,
  amount int not null,
  interest_rate int not null default 10,
  repayment_due timestamptz,
  status text not null default 'open' check (status in ('open','repaid','defaulted','cancelled')),
  created_at timestamptz default now()
);
create table if not exists public.loan_payments (
  id bigint generated always as identity primary key,
  loan_id bigint references public.point_loans(id) on delete cascade,
  payment_amount int not null,
  payment_date timestamptz default now(),
  remaining_balance int not null
);
```

## Edge
- `request_loan`, `approve_loan`, `make_payment`, `mark_default`

## Acceptance
- Saldi en resterend bedrag kloppen na elke betaling.
