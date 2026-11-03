-- Admin roles and access control.
--   manager  : everything, including the Team page (adding admins, changing roles)
--   accounts : money: revenue, orders with payments, refunds, exports, visitor stats
--   staff    : fulfilment: orders without money, stock and visibility, messages
-- Rules are enforced here in the database, so hiding a page in the dashboard is
-- never the only protection. Existing admins become managers.
-- Run once in Supabase > SQL Editor after 0002_vip.sql. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
alter table public.admin_users add column if not exists role text not null default 'manager';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admin_users_role_check') then
    alter table public.admin_users
      add constraint admin_users_role_check check (role in ('manager', 'accounts', 'staff'));
  end if;
end;
$$;

create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.admin_users where user_id = auth.uid();
$$;

create or replace function public.has_admin_role(variadic p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.admin_role() = any (p_roles), false);
$$;

-- ---------------------------------------------------------------------------
-- Activity log: who changed what in the dashboard
-- ---------------------------------------------------------------------------
create table if not exists public.admin_activity (
  id bigserial primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_created_idx on public.admin_activity (created_at desc);

alter table public.admin_activity enable row level security;

create or replace function public.log_admin_activity(p_action text, p_target text, p_details jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_activity (actor_id, actor_email, action, target, details)
  values (auth.uid(), auth.jwt() ->> 'email', p_action, p_target, p_details);
$$;

revoke all on function public.log_admin_activity(text, text, jsonb) from public, anon, authenticated;

-- Fields that changed between two versions of a row, as {field: {from, to}}
create or replace function public.changed_fields(p_old jsonb, p_new jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_object_agg(n.key, jsonb_build_object('from', p_old -> n.key, 'to', n.value)), '{}'::jsonb)
  from jsonb_each(p_new) as n
  where n.key not in ('updated_at', 'created_at')
    and (p_old -> n.key) is distinct from n.value;
$$;

-- ---------------------------------------------------------------------------
-- Staff limits on products and stock (managers can change anything)
-- ---------------------------------------------------------------------------
create or replace function public.guard_staff_product_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed text[] := case tg_table_name when 'products' then array['is_active'] else array['stock'] end;
  v_key text;
begin
  if auth.uid() is null or public.admin_role() is distinct from 'staff' then
    return new;
  end if;
  for v_key in select key from jsonb_each(public.changed_fields(to_jsonb(old), to_jsonb(new))) loop
    if not v_key = any (v_allowed) then
      raise exception 'Staff can only change % here', array_to_string(v_allowed, ', ')
        using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists products_staff_guard on public.products;
create trigger products_staff_guard before update on public.products
  for each row execute function public.guard_staff_product_edit();

drop trigger if exists product_sizes_staff_guard on public.product_sizes;
create trigger product_sizes_staff_guard before update on public.product_sizes
  for each row execute function public.guard_staff_product_edit();

-- Log dashboard edits to products, stock and the team. Checkout and payment
-- changes run without a signed-in user and are not logged here.
create or replace function public.log_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
  v_target text;
  v_details jsonb;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_target := case tg_table_name
    when 'products' then concat(v_row ->> 'name', ' (', v_row ->> 'colorway', ')')
    when 'product_sizes' then concat(
      (select concat(name, ' (', colorway, ')') from public.products where id = v_row ->> 'product_id'),
      ' size ', v_row ->> 'label')
    when 'admin_users' then (select email from auth.users where id = (v_row ->> 'user_id')::uuid)
  end;

  v_details := case tg_op
    when 'UPDATE' then public.changed_fields(to_jsonb(old), to_jsonb(new)) - 'images'
    when 'INSERT' then case tg_table_name
      when 'admin_users' then jsonb_build_object('role', v_row ->> 'role')
      when 'product_sizes' then jsonb_build_object('stock', v_row -> 'stock')
      else jsonb_build_object('price', v_row -> 'price') end
    else null
  end;

  if tg_op = 'UPDATE' and v_details = '{}'::jsonb then
    return null;
  end if;

  perform public.log_admin_activity(
    case tg_table_name
      when 'products' then 'product.'
      when 'product_sizes' then 'stock.'
      else 'team.'
    end || lower(tg_op),
    v_target,
    v_details
  );
  return null;
end;
$$;

drop trigger if exists products_activity on public.products;
create trigger products_activity after insert or update or delete on public.products
  for each row execute function public.log_admin_change();

drop trigger if exists product_sizes_activity on public.product_sizes;
create trigger product_sizes_activity after insert or update or delete on public.product_sizes
  for each row execute function public.log_admin_change();

drop trigger if exists admin_users_activity on public.admin_users;
create trigger admin_users_activity after insert or update or delete on public.admin_users
  for each row execute function public.log_admin_change();

-- Never leave the store without a manager
create or replace function public.keep_one_manager()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'manager'
     and (tg_op = 'DELETE' or new.role <> 'manager')
     and (select count(*) from public.admin_users where role = 'manager') <= 1 then
    raise exception 'The store needs at least one manager' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists admin_users_keep_manager on public.admin_users;
create trigger admin_users_keep_manager before update or delete on public.admin_users
  for each row execute function public.keep_one_manager();

-- ---------------------------------------------------------------------------
-- Row level security by role
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['orders', 'order_items', 'order_events', 'messages', 'subscribers', 'page_views'] loop
    execute format('drop policy if exists "admins manage %1$s" on public.%1$I', t);
  end loop;
end;
$$;
drop policy if exists "admins manage vip_members" on public.vip_members;
drop policy if exists "admins read admins" on public.admin_users;
drop policy if exists "admins write products" on public.products;
drop policy if exists "admins write sizes" on public.product_sizes;

-- Team: everyone can see their own role; managers manage the list
drop policy if exists "read own or managers read all" on public.admin_users;
create policy "read own or managers read all" on public.admin_users
  for select to authenticated using (user_id = auth.uid() or public.has_admin_role('manager'));
drop policy if exists "managers manage team" on public.admin_users;
create policy "managers manage team" on public.admin_users
  for all to authenticated using (public.has_admin_role('manager')) with check (public.has_admin_role('manager'));

drop policy if exists "managers read activity" on public.admin_activity;
create policy "managers read activity" on public.admin_activity
  for select to authenticated using (public.has_admin_role('manager'));

-- Products: managers do everything; staff may update (limited by the guard trigger)
drop policy if exists "managers add products" on public.products;
create policy "managers add products" on public.products
  for insert to authenticated with check (public.has_admin_role('manager'));
drop policy if exists "managers and staff update products" on public.products;
create policy "managers and staff update products" on public.products
  for update to authenticated
  using (public.has_admin_role('manager', 'staff')) with check (public.has_admin_role('manager', 'staff'));
drop policy if exists "managers delete products" on public.products;
create policy "managers delete products" on public.products
  for delete to authenticated using (public.has_admin_role('manager'));

drop policy if exists "managers add sizes" on public.product_sizes;
create policy "managers add sizes" on public.product_sizes
  for insert to authenticated with check (public.has_admin_role('manager'));
drop policy if exists "managers and staff update sizes" on public.product_sizes;
create policy "managers and staff update sizes" on public.product_sizes
  for update to authenticated
  using (public.has_admin_role('manager', 'staff')) with check (public.has_admin_role('manager', 'staff'));
drop policy if exists "managers delete sizes" on public.product_sizes;
create policy "managers delete sizes" on public.product_sizes
  for delete to authenticated using (public.has_admin_role('manager'));

-- Orders with money: managers and accounts. Staff use fulfilment_orders() below.
do $$
declare
  t text;
begin
  foreach t in array array['orders', 'order_items', 'order_events'] loop
    execute format('drop policy if exists "money roles read %1$s" on public.%1$I', t);
    execute format(
      'create policy "money roles read %1$s" on public.%1$I for select to authenticated using (public.has_admin_role(''manager'', ''accounts''))',
      t
    );
    execute format('drop policy if exists "managers write %1$s" on public.%1$I', t);
    execute format(
      'create policy "managers write %1$s" on public.%1$I for all to authenticated using (public.has_admin_role(''manager'')) with check (public.has_admin_role(''manager''))',
      t
    );
  end loop;
end;
$$;

drop policy if exists "managers and staff manage messages" on public.messages;
create policy "managers and staff manage messages" on public.messages
  for all to authenticated
  using (public.has_admin_role('manager', 'staff')) with check (public.has_admin_role('manager', 'staff'));

drop policy if exists "managers manage subscribers" on public.subscribers;
create policy "managers manage subscribers" on public.subscribers
  for all to authenticated using (public.has_admin_role('manager')) with check (public.has_admin_role('manager'));

drop policy if exists "managers manage vip_members" on public.vip_members;
create policy "managers manage vip_members" on public.vip_members
  for all to authenticated using (public.has_admin_role('manager')) with check (public.has_admin_role('manager'));

drop policy if exists "money roles read page_views" on public.page_views;
create policy "money roles read page_views" on public.page_views
  for select to authenticated using (public.has_admin_role('manager', 'accounts'));

-- Product photos: managers only
drop policy if exists "admins upload product images" on storage.objects;
drop policy if exists "admins change product images" on storage.objects;
drop policy if exists "admins delete product images" on storage.objects;
drop policy if exists "managers upload product images" on storage.objects;
create policy "managers upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.has_admin_role('manager'));
drop policy if exists "managers change product images" on storage.objects;
create policy "managers change product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.has_admin_role('manager'));
drop policy if exists "managers delete product images" on storage.objects;
create policy "managers delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.has_admin_role('manager'));

-- ---------------------------------------------------------------------------
-- Dashboard functions
-- ---------------------------------------------------------------------------

-- Revenue and analytics: managers and accounts only
revoke execute on function public.admin_overview(integer) from public, anon, authenticated;

create or replace function public.admin_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_admin_role('manager', 'accounts') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return public.admin_overview(p_days);
end;
$$;

revoke all on function public.admin_dashboard(integer) from public, anon;
grant execute on function public.admin_dashboard(integer) to authenticated;

-- Orders for packing and delivery: everything except prices and payment details
create or replace function public.fulfilment_orders()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(doc order by created_at desc)
    from (
      select
        o.created_at,
        jsonb_build_object(
          'id', o.id, 'reference', o.reference, 'status', o.status,
          'customer_name', o.customer_name, 'email', o.email, 'phone', o.phone,
          'address', o.address, 'city', o.city, 'region', o.region, 'notes', o.notes,
          'paid_at', o.paid_at, 'created_at', o.created_at,
          'order_items', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', i.id, 'product_name', i.product_name, 'colorway', i.colorway,
              'size', i.size, 'quantity', i.quantity, 'image', i.image) order by i.id)
            from public.order_items i where i.order_id = o.id), '[]'::jsonb),
          'order_events', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', e.id, 'status', e.status, 'note', e.note, 'created_at', e.created_at) order by e.id)
            from public.order_events e where e.order_id = o.id), '[]'::jsonb)
        ) as doc
      from public.orders o
      order by o.created_at desc
      limit 1000
    ) recent
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.fulfilment_orders() from public, anon;
grant execute on function public.fulfilment_orders() to authenticated;

-- Status updates for every role. Staff move orders along; only managers and
-- accounts can cancel, refund or move an order back to "paid".
create or replace function public.admin_update_order(p_order_id uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_allowed text[] := case
    when public.has_admin_role('manager', 'accounts')
      then array['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    when public.has_admin_role('staff') then array['processing', 'shipped', 'delivered']
    else array[]::text[]
  end;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.paid_at is null then
    raise exception 'Status updates unlock once payment is confirmed';
  end if;
  if public.admin_role() = 'staff' and v_order.status in ('cancelled', 'refunded') then
    raise exception 'Only managers and accounts can change a cancelled or refunded order'
      using errcode = '42501';
  end if;
  if p_status <> v_order.status and not p_status = any (v_allowed) then
    raise exception 'Your role can''t set an order to %', p_status using errcode = '42501';
  end if;
  if length(coalesce(v_note, '')) > 300 then
    raise exception 'Keep the note under 300 characters';
  end if;
  if p_status = v_order.status and v_note is null then
    return;
  end if;

  if p_status <> v_order.status then
    update public.orders set status = p_status where id = p_order_id;
  end if;
  insert into public.order_events (order_id, status, note) values (p_order_id, p_status, v_note);

  perform public.log_admin_activity(
    'order.status',
    v_order.reference,
    jsonb_build_object('from', v_order.status, 'to', p_status, 'note', v_note)
  );
end;
$$;

revoke all on function public.admin_update_order(uuid, text, text) from public, anon;
grant execute on function public.admin_update_order(uuid, text, text) to authenticated;

-- Team page: admins with their email and last sign-in (managers only)
create or replace function public.admin_team()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_admin_role('manager') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', a.user_id, 'email', u.email, 'role', a.role,
      'added_at', a.created_at, 'last_sign_in_at', u.last_sign_in_at
    ) order by a.created_at)
    from public.admin_users a
    join auth.users u on u.id = a.user_id
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_team() from public, anon;
grant execute on function public.admin_team() to authenticated;

-- Used by the server (service role) when a manager adds someone by email
create or replace function public.find_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
$$;

revoke all on function public.find_user_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_by_email(text) to service_role;
