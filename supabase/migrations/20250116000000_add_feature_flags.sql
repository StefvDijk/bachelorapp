-- Add feature flags infrastructure to events table
-- This allows per-event configuration of features

-- Add features column to events table
alter table public.events 
  add column if not exists features jsonb not null default '{
    "CORE_Bingo": {"enabled": true, "config": {}},
    "CORE_TreasureHunt": {"enabled": true, "config": {}},
    "CORE_PhotoWall": {"enabled": true, "config": {}},
    "CORE_DealShop": {"enabled": true, "config": {}},
    "CORE_SimplyWild": {"enabled": true, "config": {}},
    "CORE_SpectatorView": {"enabled": true, "config": {}},
    "SOCIAL_TeamBattle": {"enabled": false, "config": {}},
    "COMP_Leaderboard": {"enabled": false, "config": {}},
    "MEDIA_StoryMode": {"enabled": false, "config": {}}
  }'::jsonb;

-- Update existing events with default features (CORE enabled, others disabled)
update public.events 
set features = '{
  "CORE_Bingo": {"enabled": true, "config": {}},
  "CORE_TreasureHunt": {"enabled": true, "config": {}},
  "CORE_PhotoWall": {"enabled": true, "config": {}},
  "CORE_DealShop": {"enabled": true, "config": {}},
  "CORE_SimplyWild": {"enabled": true, "config": {}},
  "CORE_SpectatorView": {"enabled": true, "config": {}},
  "SOCIAL_TeamBattle": {"enabled": false, "config": {}},
  "COMP_Leaderboard": {"enabled": false, "config": {}},
  "MEDIA_StoryMode": {"enabled": false, "config": {}}
}'::jsonb
where features is null or features = '{}'::jsonb;

-- Helper function to check if a feature is enabled for an event
create or replace function public.is_feature_enabled(p_event_id uuid, p_feature_key text)
returns boolean language sql stable as $$
  select coalesce(
    (features -> p_feature_key -> 'enabled')::boolean, 
    false
  ) from public.events where id = p_event_id;
$$;

-- Helper function to get feature config for an event
create or replace function public.get_feature_config(p_event_id uuid, p_feature_key text)
returns jsonb language sql stable as $$
  select coalesce(
    features -> p_feature_key -> 'config',
    '{}'::jsonb
  ) from public.events where id = p_event_id;
$$;

-- Helper function to update feature settings
create or replace function public.update_feature_settings(
  p_event_id uuid,
  p_feature_key text,
  p_enabled boolean default null,
  p_config jsonb default null
)
returns void language plpgsql as $$
declare
  current_features jsonb;
  updated_feature jsonb;
begin
  -- Get current features
  select features into current_features from public.events where id = p_event_id;
  
  -- Build updated feature object
  updated_feature = coalesce(current_features -> p_feature_key, '{}'::jsonb);
  
  -- Update enabled if provided
  if p_enabled is not null then
    updated_feature = jsonb_set(updated_feature, '{enabled}', to_jsonb(p_enabled));
  end if;
  
  -- Update config if provided
  if p_config is not null then
    updated_feature = jsonb_set(updated_feature, '{config}', p_config);
  end if;
  
  -- Update the events table
  update public.events 
  set features = jsonb_set(current_features, array[p_feature_key], updated_feature)
  where id = p_event_id;
end;
$$;

-- Index for feature queries
create index if not exists idx_events_features on public.events using gin (features);

-- Comment for documentation
comment on column public.events.features is 'Feature flags and configuration per event. Format: {"FEATURE_KEY": {"enabled": boolean, "config": jsonb}}';
