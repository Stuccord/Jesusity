-- VIP list: visitors join with their phone number and email, and get
-- 10% off their first paid order placed with that number.
-- Run once in Supabase > SQL Editor after 0001_store.sql. Safe to re-run.

create table if not exists public.vip_members (
  id bigserial primary key,
  phone text not null unique, -- normalised to 0XXXXXXXXX
  email text,
  created_at timestamptz not null default now(),
  redeemed_order_id uuid references public.orders(id) on delete set null,
  redeemed_at timestamptz
);

create index if not exists vip_members_created_idx on public.vip_members (created_at desc);

alter table public.orders add column if not exists discount numeric(10, 2) not null default 0;
alter table public.orders add column if not exists vip_member_id bigint references public.vip_members(id) on delete set null;

alter table public.vip_members enable row level security;

drop policy if exists "admins manage vip_members" on public.vip_members;
create policy "admins manage vip_members" on public.vip_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Same as 0001, plus: a paid order that used a VIP discount uses it up
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

  if v_order.vip_member_id is not null then
    update public.vip_members
      set redeemed_order_id = v_order.id, redeemed_at = now()
      where id = v_order.vip_member_id and redeemed_at is null;
  end if;

  insert into public.order_events (order_id, status, note)
    values (v_order.id, 'paid', 'Payment received');

  return 'paid';
end;
$$;

revoke all on function public.mark_order_paid(text, text, bigint, text) from public, anon, authenticated;
