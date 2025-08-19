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

# Bachelor Party Quest — SaaS shell

Deze repo bevat:
- De marketing/landing (`public/landing.html`, `public/privacy.html`, `public/terms.html`)
- Business/tech specificatie (`BUSINESS_TECH_SPEC_NL.md`)
- Go-to-market docs (`docs/`)
- De originele PWA als submodule in `external/bachelor-party-quest-pwa`

## Ontwikkelen
- Landing/marketing starten:
```bash
npm run dev
# open http://localhost:8080/public/landing.html
```

- Originele PWA starten (submodule):
```bash
npm run pwa:dev
# open de URL die Vite toont (meestal http://localhost:5173 of 8080)
```

- Builden van de PWA:
```bash
npm run pwa:build
```

Zorg dat je de submodule hebt gecloned/geïnitialiseerd:
```bash
git submodule update --init --recursive
npm ci --prefix external/bachelor-party-quest-pwa
```
