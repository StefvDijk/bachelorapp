-- RLS policies for multi-tenant (player via session context; organizer TBD)

-- Session context helpers
create or replace function public.set_session_context(session_id text)
returns void language plpgsql security definer as $$
begin
  perform set_config('app.session_id', coalesce(session_id, ''), true);
end;
$$;

-- Enable RLS
alter table public.sessions enable row level security;
alter table public.bingo_tasks enable row level security;
alter table public.treasure_hunt enable row level security;
alter table public.challenges enable row level security;
alter table public.live_messages enable row level security;
alter table public.shop_purchases enable row level security;
alter table public.points_history enable row level security;

-- Basic player visibility scoped by session_id set in context
create policy if not exists p_sessions_player on public.sessions
for select using (
  current_setting('app.session_id', true) <> ''
  and id = current_setting('app.session_id', true)
);

create policy if not exists p_bingo_player on public.bingo_tasks
for select using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_treasure_player on public.treasure_hunt
for select using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_challenges_player on public.challenges
for select using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_live_messages_player on public.live_messages
for select using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_shop_purchases_player on public.shop_purchases
for select using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_points_history_player on public.points_history
for select using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

-- Mutations for player on own rows
create policy if not exists p_bingo_player_write on public.bingo_tasks
for update using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_treasure_player_write on public.treasure_hunt
for update using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_challenges_player_write on public.challenges
for update using (
  current_setting('app.session_id', true) <> ''
  and session_id = current_setting('app.session_id', true)
);

create policy if not exists p_sessions_player_write on public.sessions
for update using (
  current_setting('app.session_id', true) <> ''
  and id = current_setting('app.session_id', true)
);

-- Organizer policies (placeholder: allow everything for now via anon)
-- TODO: Replace with auth.uid() matching organizer account scope
create policy if not exists p_admin_read_all on public.bingo_tasks for select using (true);
create policy if not exists p_admin_update_all on public.bingo_tasks for update using (true);
create policy if not exists p_admin_update_sessions on public.sessions for update using (true);
create policy if not exists p_admin_select_sessions on public.sessions for select using (true);
create policy if not exists p_admin_update_treasure on public.treasure_hunt for update using (true);
create policy if not exists p_admin_select_treasure on public.treasure_hunt for select using (true);
create policy if not exists p_admin_update_challenges on public.challenges for update using (true);
create policy if not exists p_admin_select_challenges on public.challenges for select using (true);
create policy if not exists p_admin_select_live_messages on public.live_messages for select using (true);
create policy if not exists p_admin_insert_live_messages on public.live_messages for insert with check (true);
create policy if not exists p_admin_insert_shop_purchases on public.shop_purchases for insert with check (true);
create policy if not exists p_admin_select_shop_purchases on public.shop_purchases for select using (true);
create policy if not exists p_admin_insert_points_history on public.points_history for insert with check (true);
create policy if not exists p_admin_select_points_history on public.points_history for select using (true);

