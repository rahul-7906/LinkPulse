-- Remove the optional Location Insights feature from an existing LinkPulse DB.
-- Existing click rows stay in place; only location-specific fields are dropped.

drop function if exists public.authorize_location_enrichment(bigint, bigint, text);
drop function if exists public.record_click_event(bigint, text, text, boolean, boolean, text, text, text, text[]);
drop function if exists public.record_click_event(bigint, text, text, boolean, boolean, text, text, text, text[], text);

drop index if exists public.clicks_event_key_hash_idx;

alter table public.links
  drop column if exists location_enabled;

alter table public.clicks
  drop column if exists country_code,
  drop column if exists region,
  drop column if exists city,
  drop column if exists location_status,
  drop column if exists event_key_hash;

create function public.record_click_event(
  p_link_id bigint,
  p_user_agent text,
  p_device_type text,
  p_is_ghost boolean,
  p_is_bot boolean,
  p_bot_reason text,
  p_source_platform text,
  p_traffic_class text,
  p_validation_reasons text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_link public.links%rowtype;
  was_counted boolean := false;
  event_status text := 'filtered';
begin
  select * into target_link
  from public.links
  where id = p_link_id
  for update;

  if not found then
    raise exception 'Link not found';
  end if;

  if target_link.is_disabled then
    raise exception 'Link is disabled';
  end if;

  if target_link.expires_at is not null and target_link.expires_at <= now() then
    raise exception 'Link has expired';
  end if;

  if not p_is_bot and not p_is_ghost
     and (target_link.click_limit is null or target_link.clicks_count < target_link.click_limit) then
    update public.links
    set clicks_count = clicks_count + 1
    where id = p_link_id;
    was_counted := true;
    event_status := 'counted';
  elsif not p_is_bot and not p_is_ghost then
    event_status := 'limit_reached';
  elsif p_is_bot then
    event_status := 'bot_filtered';
  elsif p_is_ghost then
    event_status := 'ghost_filtered';
  end if;

  insert into public.clicks (
    link_id, user_agent, device_type, is_ghost, ghost_reason,
    is_bot, bot_reason, source_platform, traffic_class,
    validation_reasons, counted
  ) values (
    p_link_id, p_user_agent, p_device_type, p_is_ghost,
    case when p_is_ghost then 'rapid_repeat' else null end,
    p_is_bot, p_bot_reason, p_source_platform, p_traffic_class,
    coalesce(p_validation_reasons, '{}'), was_counted
  );

  return jsonb_build_object(
    'counted', was_counted,
    'status', event_status
  );
end;
$$;

revoke all on function public.record_click_event(bigint, text, text, boolean, boolean, text, text, text, text[]) from public;
grant execute on function public.record_click_event(bigint, text, text, boolean, boolean, text, text, text, text[]) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
