# MEDIA: Meme Generator — Uitvoerbare Specificatie

## Doel
Maak memes op basis van templates en eigen foto’s.

## Data Model (SQL)
```sql
create table if not exists public.meme_templates (
  id bigint generated always as identity primary key,
  event_id uuid,
  name text not null,
  image_url text not null,
  text_areas jsonb not null default '[]'::jsonb,
  category text
);
create table if not exists public.generated_memes (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  session_id uuid not null,
  template_id bigint references public.meme_templates(id),
  source_photo_url text,
  meme_url text not null,
  text_content jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
```

## RLS
```sql
alter table public.meme_templates enable row level security;
create policy mt_public_read on public.meme_templates for select using (true);

alter table public.generated_memes enable row level security;
create policy gm_owner_read on public.generated_memes for select using (
  current_setting('app.session_id', true) = session_id::text
);
```

## Edge
- `render_meme` → server-side Canvas render (optioneel) of client-side.

## Acceptance
- Export (png) ≤ 1MB, correct overlay.

## Tests
- TC1 Render met lange tekst wrapt correct.
