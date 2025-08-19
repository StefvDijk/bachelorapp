## Go-To-Market checklist (NL)

### Fase 0: fundament (1–3 dagen)
- [ ] Demo-event seeden (dummy data + spectator preview)
- [ ] Landing page publiceren (`public/landing.html`) met CTA's: Demo, Koop event
- [ ] Pricing bepalen (Basic/Plus/Pro) en copy finaliseren (`docs/WEBSITE_COPY.md`)
- [ ] Privacy & Terms publiceren (`/public/privacy.html`, `/public/terms.html`)
- [ ] Analytics (Plausible of PostHog) en basic events configureren

### Fase 1: betaalstroom (2–4 dagen)
- [ ] Stripe producten/prijzen aanmaken (Basic/Plus/Pro) – zie `docs/STRIPE_SETUP.md`
- [ ] Checkout + webhook (Supabase Edge) → `events.billing_status = 'paid'`
- [ ] Gating: foto-uploads en spectator-link alleen bij `paid`
- [ ] E-mail bevestiging en receipt (Stripe) + in-app success page

### Fase 2: distributie (3–7 dagen)
- [ ] SEO basics: meta tags, OG, sitemap, keywords (`docs/WEBSITE_COPY.md`)
- [ ] Content: 3 short posts + 1 long-form guide (NL/EN)
- [ ] Referral: unieke code → korting 10% op volgende event
- [ ] Partnerships: shortlist 20 planners/cafés + outreach e-mailtemplate
- [ ] Social: 3x TikTok/IG Reels (demo/spectator flow)

### Fase 3: betrouwbaarheid en support (1–2 dagen)
- [ ] Retentie/cleanup jobs + data-export (MVP)
- [ ] Support: help-sectie + contact (mail of form)
- [ ] Consent & verwijderverzoek flow checken

### KPI’s (wekelijks monitoren)
- [ ] Demo → betaalde event (8–15%)
- [ ] Gem. orderwaarde €65–€120
- [ ] Foto’s per event 400–1200
- [ ] Refund < 3%

### Quick links
- Landing: `public/landing.html`
- Copy: `docs/WEBSITE_COPY.md`
- Stripe: `docs/STRIPE_SETUP.md`
- Juridisch: `public/privacy.html`, `public/terms.html`
