# Bachelor Party Quest (SaaS)

White-label PWA voor vrijgezellenfeesten met spellen (bingo, treasure hunt, live challenges), spectator feed en admin dashboard. Multi-tenant (Supabase), offline-queue, realtime updates.

## Setup

1. Kopieer `.env.example` naar `.env` en vul:
   - `VITE_SUPABASE_URL=`
   - `VITE_SUPABASE_ANON_KEY=`
2. Installeren en starten:
   - `npm i`
   - `npm run dev`

## Build

```
npm run build
npm run preview
```

## Supabase

- Migrations in `supabase/migrations`
- Edge function: `initialize-session`

## Licentie

Proprietary – niet doorverkopen zonder toestemming.
