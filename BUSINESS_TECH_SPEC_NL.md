### Samenvatting in 1 minuut
- Een white‑label PWA voor vrijgezellenfeesten met kant‑en‑klare spellen (bingo, “zoek de rest”, live challenges), foto-feed en spectator view. 
- Verkoop per event (eenmalig) met add‑ons (extra storage, white‑label, photobook), of via abonnement voor event‑planners.
- Technisch: multi‑tenant Supabase (Postgres, RLS, Storage), React/Vite PWA met offline queue en realtime kanalen; template‑gedreven content; Stripe Checkout.

### Positionering en doelgroep
- Doelgroep: vrienden/groepen die een vrijgezellenfeest organiseren; event‑planners (B2B); kroegen/citygames die “plug‑and‑play” willen.
- Uniek: smartphone‑first PWA, direct startklaar, spectator feed voor de groep, offline‑proof, en volledig te themen (branding bachelor + stad/avond).

### Waardepropositie
- Voor de organisator: binnen 10 min klaar met persoonlijk spel, realtime regie (live berichten/challenges), automatische fotoback‑up, scoreboard/punten, geen app‑store gedoe.
- Voor de groep: leuke social mechanics (punten, shop, gokspel), live feed, duidelijke flow (treasure → bingo → feest).

### Product en features (vermarktbaar)
- Spellen:
  - **Bingo 5×5**: 25 opdrachten, punten, bonusregels, fotobewijs + spectator feed.
  - **Zoek de rest**: quizvraag → GPS of hint, fotobewijs vereist.
  - **Live challenges**: admin pusht real‑time opdrachten.
  - **Deal Maker’s Shop**: punten ruilen voor privileges.
  - **Simply Wild**: lichtgewicht gokspel met credits = punten.
- Regie:
  - **Admin dashboard**: reset/selectief reset, live berichten/uitdagingen, sessies, back‑ups, systeemcheck.
  - **Spectator view**: lees‑alleen feed + voortgang (met share‑link/QR).
- Personaliseerbaarheid:
  - **Templates** per thema (stad, bachelorprofiel, humorstijl), kleur/beeldmerk upload, tekst‑editor.
  - **Meertaligheid** (NL/EN/DE).
- Opslag/veiligheid:
  - **Foto‑opslag + event‑day back‑up**; **offline‑queue** voor uploads/actie.
  - **RLS** per event/sessie; gedeelde openbare spectator alleen per event.

### Verdienmodel en prijzen
- Model A (B2C per event):
  - **Basic**: €39/event (max 1 dag, 250 foto’s, standaard templates/branding).
  - **Plus**: €99/event (1.000 foto’s, custom logo/thema, custom domein alias, spectator branding).
  - **Pro**: €199/event (3.000 foto’s, premium templates, data‑export, prioriteit support).
- Model B (B2B planners, abonnement):
  - **Starter** €49/maand (3 events/maand, 3.000 foto’s totaal).
  - **Agency** €149/maand (10 events/maand, 15.000 foto’s, multi‑team, white‑label).
- Add‑ons:
  - Extra opslag (bijv. +€10 per +2.000 foto’s).
  - White‑label (eigen subdomein) €29/event of inclusief in Agency.
  - AI challenge‑generator (€9/event).
  - Photobook integratie (revshare of marge €15‑€25 per boek).
- Upsells: corporate team‑building variant; city‑pub‑crawl templates.

### Go‑to‑market
- Website met demo‑event (spectator preview + dummy spelerflow).
- SEO: “vrijgezellenfeest app”, “bachelor party bingo”, “city game app”.
- Partnerships: event‑planners, cafés/tour‑operators, vrijgezellenplatforms (affiliate codes).
- Social proof: TikTok/IG Reels van geslaagde avonden (met expliciet consent).
- Referral: 10% korting voor de volgende groep via unieke code.

### Juridisch/privacy
- In‑app consent voor foto’s; verwijderverzoek per link (admin + speler).
- Retentie: 60 dagen standaard, daarna auto‑verwijderen (instelbaar).
- DPA met Supabase; datacenters EU; duidelijke T&C’s.

### Technische specificatie (MVP SaaS)

- Front‑end
  - Stack: React 18 + Vite, shadcn/ui, Tailwind; PWA met `public/sw.js`; Capacitor optioneel voor stores.
  - Router: `react-router-dom`; offline queue + background sync.
  - State/data: Supabase realtime channels + fetch; eenvoudige React Query kan worden toegevoegd voor caching.
  - Theming: thematiseerbare kleurset en image‑assets per event; template JSON.

- Back‑end (Supabase)
  - Postgres + RLS; Edge Functions (init, dupliceren template, Stripe webhook).
  - Storage buckets: `photos` (prefix per event), `backups` (optioneel).
  - Realtime kanalen: bingo/challenges/messages.

- Multi‑tenant model (kern)
  - Tabellen (indicatief, enkel de kern):
    - `accounts` (organizer), `events` (tenant‑scope), `sessions` (speler‑runtime), `bingo_tasks`, `treasure_hunt`, `challenges`, `shop_purchases`, `points_history`, `live_messages`.
  - Sleutels:
    - Alles heeft `event_id`; `sessions.event_id` + `user_name`; taken/challenges koppelen aan `event_id` + optioneel `session_id`.
  - RLS (indicatie):
    - Organizer JWT → CRUD binnen eigen `account_id`/`event_id`.
    - Player sessie → via `set_session_context(session_id)` alleen bijbehorende rijen (`event_id` en/of `session_id`) zichtbaar.
    - Public spectator → `events.is_public = true` en read‑only views die foto‑url + completed status exposen.

```sql
-- Voorbeeld: bingo_tasks RLS
create policy player_read_bingo on public.bingo_tasks
for select using (
  current_setting('app.session_id', true) is not null
  and session_id = current_setting('app.session_id', true)
);

create policy organizer_manage_bingo on public.bingo_tasks
for all using (
  auth.role() = 'organizer'
  and event_id in (select event_id from organizer_events where organizer_id = auth.uid())
);
```

- Storage & media
  - Structuur: `photos/{event_id}/{type}/bingo-{task_id}-{timestamp}.jpg`.
  - Publieke URL’s voor spectator; privé paden voor admin.
  - Compressie client‑side (al aanwezig) en max resolutie (1200px) behouden.

- Offline en realtime
  - Offline queue (reeds aanwezig) voor: foto’s, task completion, punten, treasure found.
  - Realtime kanalen: `bingo_tasks`, `challenges`, `live_messages` gefilterd per `event_id`.

- AuthN/AuthZ
  - Organizer: Supabase Auth magic link/OTP.
  - Player: anonieme sessie + `set_session_context(session_id)`.
  - Spectator: publieke read‑only route met `event_slug` en rate‑limiting.

- Betaalstroom (Stripe)
  - Checkout sessie → `events.billing_status='paid'` via webhook.
  - Gating: aanmaken/download spectator link en foto‑uploads alleen als `paid`.

- Observability & kwaliteit
  - Sentry (frontend) + Supabase logs; cron jobs: opschonen oude events/foto’s; dagelijkse back‑up.
  - Rate‑limit inserts naar `live_messages` en foto’s per sessie.

### Datamodel (indicatief)
- `accounts(id, name, owner_user_id)`
- `events(id, account_id, name, slug, date, is_public, theme, billing_status)`
- `sessions(id, event_id, user_name, points_balance, last_activity)`
- `bingo_tasks(id, event_id, session_id, title, description, completed, completed_at, photo_url, position)`
- `treasure_hunt(id, event_id, session_id, location_name, found, found_at, photo_url, order_index)`
- `challenges(id, event_id, session_id, title, description, type, completed, completed_at, photo_url)`
- `live_messages(id, event_id, session_id, message, message_type, created_at)`
- `shop_purchases(id, event_id, session_id, item_id, item_name, price, purchased_at)`
- `points_history(id, event_id, session_id, transaction_type, amount, description, created_at)`

### Builder en content
- Event‑wizard: naam, datum, foto/branding, taal, spelkeuze, template kiezen/aanpassen.
- Template gallery: steden, thema’s, humorstijlen.
- CSV/JSON import/export voor taken; dupliceren van eerdere events (Edge Function).

### Roadmap
- Week 0‑2: multi‑tenant schema + RLS; event‑wizard; Stripe Checkout; storage prefixing; spectator per event.
- Week 3‑4: template gallery + theme system; i18n; admin v2 (per‑event).
- Week 5‑6: analytics (voltooide opdrachten, foto‑count), e‑mail rapport + data‑export; photobook MVP; AI challenge generator.

### KPI’s
- Conversion: demo → betaalde event (target 8‑15%).
- AOV: €65‑€120/event (incl. add‑ons).
- Foto’s per event: 400‑1200 (opschaling en kostenmonitoring).
- Refund rate < 3%.

### Risico’s en mitigaties
- Opslagkosten: compressie + retentie; add‑on voor extra storage.
- Privacy: consent, retentie, verwijderen op verzoek.
- Performance: lazy loading feed, thumbnails, realtime filtering per event.

- - -

- Belangrijkste verbeteringen richting product:
  - Content uit code halen naar templates/DB; `event_id` overal; RLS hardmaken op eventniveau.
  - Storage paden prefixen met `event_id`; spectator public view per event.
  - Organizer‑auth, event‑wizard en Stripe.
  - Branding/thema’s + i18n.

- Monetisatie:
  - Prijs per event (Basic/Plus/Pro) + add‑ons; abonnement voor planners; photobook integratie.

- Techniek:
  - Supabase multi‑tenant met RLS; PWA met offline queue en realtime; Stripe gating.

