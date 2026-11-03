-- Jesusity store schema: catalog, stock, orders, messages, subscribers,
-- visitor analytics and admin access. Run once in the Supabase SQL editor
-- (or with `supabase db push`), then run seed.sql.


-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  colorway text not null default '',
  category text not null default 'Tees',
  collection text,
  collection_slug text,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  badge text,
  images jsonb not null default '{}'::jsonb,
  default_view text not null default 'front' check (default_view in ('front', 'back')),
  swatches jsonb,
  story jsonb,
  details jsonb,
  size_chart jsonb,
  related_slugs text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_sizes (
  product_id text not null references public.products (id) on delete cascade on update cascade,
  label text not null,
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  primary key (product_id, label)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'pending_payment' check (
    status in (
      'pending_payment', 'payment_failed', 'paid', 'processing',
      'shipped', 'delivered', 'cancelled', 'refunded'
    )
  ),
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  region text not null,
  notes text,
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null,
  total numeric(10, 2) not null,
  currency text not null default 'GHS',
  payment_provider text not null default 'paystack',
  payment_reference text,
  payment_channel text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null on update cascade,
  product_name text not null,
  colorway text,
  size text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  image text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Status timeline shown to the customer on the tracking page
create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Inbound: contact messages, newsletter + back-in-stock requests
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email text not null,
  source text not null check (source in ('newsletter', 'restock')),
  product_id text references public.products (id) on delete cascade on update cascade,
  size text,
  created_at timestamptz not null default now()
);

create unique index if not exists subscribers_unique_idx
  on public.subscribers (lower(email), source, coalesce(product_id, ''), coalesce(size, ''));

-- ---------------------------------------------------------------------------
-- Visitor analytics (no IP addresses stored)
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  session_id text not null,
  path text not null,
  referrer text,
  country text,
  city text,
  device text,
  browser text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Payment confirmation: marks an order paid and deducts stock exactly once.
-- Only callable with the service role (server code), never from the browser.
-- ---------------------------------------------------------------------------
create or replace function public.mark_order_paid(
  p_reference text,
  p_payment_reference text,
  p_amount_pesewas bigint,
  p_channel text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where reference = p_reference for update;
  if not found then
    return 'not_found';
  end if;

  if v_order.status <> 'pending_payment' and v_order.status <> 'payment_failed' then
    return 'already_processed';
  end if;

  if round(v_order.total * 100) <> p_amount_pesewas then
    update public.orders set status = 'payment_failed' where id = v_order.id;
    insert into public.order_events (order_id, status, note)
      values (v_order.id, 'payment_failed', 'Amount paid did not match the order total');
    return 'amount_mismatch';
  end if;

  update public.orders
    set status = 'paid',
        payment_reference = p_payment_reference,
        payment_channel = p_channel,
        paid_at = now()
    where id = v_order.id;

  for v_item in select product_id, size, quantity from public.order_items where order_id = v_order.id loop
    update public.product_sizes
      set stock = greatest(stock - v_item.quantity, 0)
      where product_id = v_item.product_id and label = v_item.size;
  end loop;

  insert into public.order_events (order_id, status, note)
    values (v_order.id, 'paid', 'Payment received');

  return 'paid';
end;
$$;

revoke all on function public.mark_order_paid(text, text, bigint, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin analytics in one round trip
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := date_trunc('day', now()) - make_interval(days => greatest(p_days, 1) - 1);
  v_paid text[] := array['paid', 'processing', 'shipped', 'delivered'];
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'revenue', coalesce((select sum(total) from orders where status = any(v_paid) and created_at >= v_since), 0),
    'orders', (select count(*) from orders where status = any(v_paid) and created_at >= v_since),
    'pending_orders', (select count(*) from orders where status in ('paid', 'processing')),
    'abandoned_checkouts', (select count(*) from orders where status in ('pending_payment', 'payment_failed') and created_at >= v_since),
    'visitors', (select count(distinct session_id) from page_views where created_at >= v_since),
    'page_views', (select count(*) from page_views where created_at >= v_since),
    'visitors_today', (select count(distinct session_id) from page_views where created_at >= date_trunc('day', now())),
    'unread_messages', (select count(*) from messages where not is_read),
    'subscribers', (select count(*) from subscribers where source = 'newsletter'),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', to_char(d.day, 'YYYY-MM-DD'),
        'visitors', coalesce(v.visitors, 0),
        'views', coalesce(v.views, 0),
        'orders', coalesce(o.orders, 0),
        'revenue', coalesce(o.revenue, 0)
      ) order by d.day), '[]'::jsonb)
      from generate_series(v_since, date_trunc('day', now()), interval '1 day') as d(day)
      left join (
        select date_trunc('day', created_at) as day, count(distinct session_id) as visitors, count(*) as views
        from page_views where created_at >= v_since group by 1
      ) v on v.day = d.day
      left join (
        select date_trunc('day', created_at) as day, count(*) as orders, sum(total) as revenue
        from orders where status = any(v_paid) and created_at >= v_since group by 1
      ) o on o.day = d.day
    ),
    'top_pages', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select path, count(*) as views, count(distinct session_id) as visitors
        from page_views where created_at >= v_since
        group by path order by views desc limit 10
      ) t
    ),
    'referrers', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(nullif(referrer, ''), 'Direct') as source, count(distinct session_id) as visitors
        from page_views where created_at >= v_since
        group by 1 order by visitors desc limit 10
      ) t
    ),
    'countries', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(country, 'Unknown') as country, count(distinct session_id) as visitors
        from page_views where created_at >= v_since
        group by 1 order by visitors desc limit 10
      ) t
    ),
    'devices', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(device, 'Unknown') as device, count(distinct session_id) as visitors
        from page_views where created_at >= v_since
        group by 1 order by visitors desc
      ) t
    ),
    'top_products', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select oi.product_name || coalesce(' · ' || nullif(oi.colorway, ''), '') as name,
          sum(oi.quantity) as units, sum(oi.quantity * oi.unit_price) as revenue
        from order_items oi join orders o on o.id = oi.order_id
        where o.status = any(v_paid) and o.created_at >= v_since
        group by 1 order by units desc limit 5
      ) t
    ),
    'low_stock', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select p.id, p.name, p.colorway, s.label as size, s.stock
        from product_sizes s join products p on p.id = s.product_id
        where p.is_active and s.stock <= 3
        order by s.stock, p.name limit 20
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_overview(integer) from public, anon;
grant execute on function public.admin_overview(integer) to authenticated;

-- Units sold per product (paid orders), used for "best selling" sort
create or replace view public.product_sales
with (security_invoker = false)
as
  select oi.product_id, sum(oi.quantity)::integer as units_sold
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('paid', 'processing', 'shipped', 'delivered')
  group by oi.product_id;

grant select on public.product_sales to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- Public visitors can only read active products and their sizes. Everything
-- else is written by server code (service role) and read by admins.
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.messages enable row level security;
alter table public.subscribers enable row level security;
alter table public.page_views enable row level security;

drop policy if exists "admins read admins" on public.admin_users;
create policy "admins read admins" on public.admin_users
  for select to authenticated using (public.is_admin());

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "admins write products" on public.products;
create policy "admins write products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read sizes" on public.product_sizes;
create policy "public read sizes" on public.product_sizes
  for select to anon, authenticated using (true);

drop policy if exists "admins write sizes" on public.product_sizes;
create policy "admins write sizes" on public.product_sizes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
declare
  t text;
begin
  foreach t in array array['orders', 'order_items', 'order_events', 'messages', 'subscribers', 'page_views'] loop
    execute format('drop policy if exists "admins manage %1$s" on public.%1$I', t);
    execute format(
      'create policy "admins manage %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Product image storage (public read, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins change product images" on storage.objects;
create policy "admins change product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
