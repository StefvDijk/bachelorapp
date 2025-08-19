## Stripe-setup (NL)

### 1) Producten en prijzen
Maak 3 producten aan met prijzen (one-time, EUR):
- Basic: €39
- Plus: €99
- Pro: €199

Optioneel add-ons (one-time): extra storage, white-label, AI challenges.

Noteer `price_id` waardes per plan.

### 2) Omgevingsvariabelen
In `.env` (frontend) of Supabase Edge Functions:
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 3) Checkout-flow (frontend)
- Knop “Koop event” → call backend endpoint: `POST /create-checkout-session` met `plan`, `account_id`, optioneel `event_id` (bij upgrade)
- Backend antwoordt met `url` → redirect naar Stripe Checkout

### 4) Webhook (Supabase Edge Function)
- Event: `checkout.session.completed`
- Zoeken bijbehorende `account_id`/`event_id` uit `metadata`
- Zet `events.billing_status = 'paid'`
- Log purchase in `billing_events` (optioneel)

### 5) Gating in app
- Alleen `paid` events mogen:
  - foto-uploads
  - spectator-link genereren
  - downloads/export

### 6) Testen
- Stripe testkaarten (`4242 4242 4242 4242` etc.)
- Failsafe: mislukt webhook → cron job die Checkout Sessions reconcilieert

### 7) Dashboard en refunds
- Toon billing-status per event in Admin
- Laat upgrade naar Plus/Pro toe via nieuwe Checkout
- Refunds via Stripe Dashboard; sync status met Supabase
