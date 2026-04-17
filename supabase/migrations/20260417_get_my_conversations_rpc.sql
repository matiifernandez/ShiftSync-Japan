-- Chat list RPC used by the mobile app.
-- Returns one row per conversation where the current user participates.

drop function if exists public.get_my_conversations();

create or replace function public.get_my_conversations()
returns table (
  id uuid,
  name text,
  type text,
  last_message text,
  last_message_time timestamp with time zone,
  avatar_url text,
  unread_count bigint,
  is_pinned boolean
)
language sql
security invoker
set search_path = public
as $$
  with me as (
    select auth.uid() as user_id
  ),
  my_participation as (
    select
      cp.conversation_id,
      cp.last_read_at,
      cp.is_pinned
    from public.conversation_participants cp
    join me on cp.user_id = me.user_id
  ),
  latest_messages as (
    select distinct on (m.conversation_id)
      m.conversation_id,
      m.content_original,
      m.created_at
    from public.messages m
    join my_participation mp on mp.conversation_id = m.conversation_id
    order by m.conversation_id, m.created_at desc
  ),
  unread_messages as (
    select
      m.conversation_id,
      count(*)::bigint as unread_count
    from public.messages m
    join my_participation mp on mp.conversation_id = m.conversation_id
    join me on true
    where m.sender_id <> me.user_id
      and m.created_at > coalesce(mp.last_read_at, to_timestamp(0))
    group by m.conversation_id
  )
  select
    c.id,
    coalesce(
      nullif(c.name, ''),
      case
        when c.type::text = 'direct' then coalesce(other_user.full_name, 'Direct chat')
        else 'Group chat'
      end
    ) as name,
    c.type::text as type,
    lm.content_original as last_message,
    lm.created_at as last_message_time,
    case
      when c.type::text = 'direct' then other_user.avatar_url
      else null
    end as avatar_url,
    coalesce(um.unread_count, 0) as unread_count,
    mp.is_pinned
  from my_participation mp
  join public.conversations c on c.id = mp.conversation_id
  left join latest_messages lm on lm.conversation_id = c.id
  left join unread_messages um on um.conversation_id = c.id
  left join lateral (
    select
      p.full_name,
      p.avatar_url
    from public.conversation_participants cp2
    join public.profiles p on p.id = cp2.user_id
    join me on true
    where cp2.conversation_id = c.id
      and cp2.user_id <> me.user_id
    order by p.full_name nulls last, p.id
    limit 1
  ) as other_user on true
  order by
    mp.is_pinned desc,
    lm.created_at desc nulls last,
    c.created_at desc;
$$;

revoke all on function public.get_my_conversations() from public;
grant execute on function public.get_my_conversations() to authenticated;
grant execute on function public.get_my_conversations() to service_role;
