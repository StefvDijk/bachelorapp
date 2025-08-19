# CORE: Simply Wild — Uitvoerbare Specificatie

## Doel
Punten inzetten in een slot-achtig spel met kans op winst of verlies en optionele jackpot.

## Data Model (SQL)
```sql
create table if not exists public.gambling_sessions (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  bet_amount int not null,
  result text not null check (result in ('win','lose','jackpot')),
  winnings int not null default 0,
  played_at timestamptz default now(),
  game_type text not null default 'simply_wild'
);

create table if not exists public.jackpot_pool (
  event_id uuid primary key,
  current_amount int not null default 0,
  last_winner uuid
);
```

## RLS Policies
```sql
alter table public.gambling_sessions enable row level security;
create policy gambling_owner on public.gambling_sessions for select using (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)::uuid
);
```

## Edge Functions
### `play_simply_wild`
Input: `{ event_id, session_id, bet }`
Logic:
- Validate bet in min/max
- Deduct points (atomic)
- Roll outcome based on probabilities & house edge
- Compute winnings, update points, possibly jackpot
- Return `{ result, winnings, new_balance }`

## Acceptance Criteria
1. Bets buiten min/max worden geweigerd.
2. Bij verlies: alleen bet afgeschreven; bij winst: saldo verhoogd met winnings.
3. Jackpot vergroot bij elke bet; reset bij jackpot-win.
4. Alle rondes zijn gelogd in `gambling_sessions`.

## Testcases
- TC1 Bet=0 of <min → fail.
- TC2 Win scenario → winnings > 0 en sessie gelogd.
- TC3 Jackpot scenario → jackpot reset en winnaar gelogd.
- TC4 Concurrentie: atomicity van punten transacties.

## Frontend Integratie
- Hook `useSimplyWild()` met `play(bet)` → animatie, geluid, resultatenoverlay.
- UI: inzet selector, start-knop, balansindicator, jackpot teller.
