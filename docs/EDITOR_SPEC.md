## Editor (no-code) — Specificatie (MVP)

### Doel
Organisatoren kunnen zonder code alle teksten, kleuren en beelden aanpassen en als event-template opslaan/publiceren.

### Concept
- Edit-modus toggle (admin): klik-bare elementen met omlijning; inline WYSIWYG tekst, kleurkiezers, afbeelding upload.
- Template als JSON per event: `branding`, `texts`, `pages.*`, `features`.
- Draft → Publish: wijzigingen eerst als draft; publicatie zet live voor spelers/spectator.

### Datastructuur (indicatief)
```json
{
  "branding": {"name": "Bachelor Party", "primary": "#0b5bd3", "secondary": "#111111", "logoUrl": "/assets/logo.png"},
  "texts": {
    "hero.title": "Vrijgezellenfeest? Regel een interactieve game-night in 10 minuten.",
    "hero.subtitle": "Bingo 5×5, zoektochten, live challenges en foto-feed",
    "footer.copyright": "© Bachelor Party Quest"
  },
  "pages": {
    "bingo": {"title": "Bingo 5×5", "intro": "Maak 25 uitdagingen en scoor punten."},
    "challenges": {"title": "Live challenges"},
    "spectator": {"title": "Kijk live mee!"}
  },
  "features": {"spectator": true, "dealShop": true}
}
```

### UI (MVP)
- Linker paneel: secties Branding, Teksten, Pagina's, Features
- Hoofdscherm: live preview met gekozen template
- Acties: Laden (JSON), Opslaan/Download (JSON), Publiceren (schrijft naar `events.template`)

### Integratie (app)
- Client laadt `template` per event (Supabase) en levert aan UI-layer
- `useContent(key, fallback)` hook haalt uit template; inline `data-edit-key` markeert bewerkbaar
- Theming via CSS vars uit `branding` (primary/secondary)

### RLS/Beveiliging
- Alleen organizer met toegang tot `event_id` mag template lezen/schrijven
- Draft in `event_templates` tabel; publish kopieert naar `events.template`

### Roadmap
- V1: Teksten/kleuren/logo + preview, JSON import/export
- V2: Layout-secties en component-varianten (hero A/B), meertaligheid
- V3: Template gallery en delen/dupliceren tussen events
