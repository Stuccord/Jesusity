# Going live: setup checklist

The store runs on three services you own:

| Service | What it does | Cost to start |
| --- | --- | --- |
| **Supabase** | Database for products, stock, orders, messages, visitor stats; admin login; product photo storage | Free tier |
| **Paystack** | Takes payments: Mobile Money (MTN, Telecel, AirtelTigo) and cards, in GH₵ | No monthly fee; per-transaction fee |
| **Vercel** | Hosts the website and your domain | Free tier |

Until Supabase and Paystack are connected, the site shows the launch catalog
and checkout politely says payments aren't available yet. Nothing is faked.

---

## 1. Supabase (database + admin login)

1. Create a project at [supabase.com](https://supabase.com). Pick the region closest to Ghana (e.g. EU West / Frankfurt).
2. Open **SQL Editor**, paste all of `supabase/migrations/0001_store.sql`, and run it.
3. In a new query, paste `supabase/seed.sql` and run it. This loads your current products.
   Every in-stock size starts at **10 units**: set your real stock in the admin dashboard afterwards.
4. Go to **Project Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)
5. **Create your admin login:** Authentication → Users → **Add user** → enter your email and a strong password (tick "Auto confirm").
6. Make that user an admin. In the SQL Editor run (with your email):

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

   Repeat for anyone else who should see the dashboard.
7. Authentication → **Sign In / Providers**: turn **off** "Allow new users to sign up".
   Admins are added by you only.
8. Authentication → **URL Configuration**: set Site URL to your domain (e.g. `https://www.your-domain.com`)
   and add `https://www.your-domain.com/admin` to Redirect URLs (for password resets).

## 2. Paystack (payments)

1. Sign up at [paystack.com](https://paystack.com) as a Ghana business and complete **Go Live** verification
   (business documents + settlement bank or MoMo account). Test mode works before that.
2. **Settings → API Keys & Webhooks**:
   - Copy the **Secret key** → `PAYSTACK_SECRET_KEY` (`sk_test_…` for testing, `sk_live_…` when live).
   - Set **Webhook URL** to `https://www.your-domain.com/api/paystack/webhook`.
     This confirms payments even if a customer closes their browser before returning to the site.
3. Make sure Mobile Money and Card are enabled under **Settings → Preferences → Payment channels**.

## 3. Vercel (hosting + domain)

1. Import this GitHub repo in Vercel (it's already set up for it).
2. **Settings → Environment Variables**: add every variable from `.env.example` with your real values.
3. **Settings → Domains**: add your domain and follow the DNS instructions from your registrar.
4. Set `SITE_URL` to the final domain, then **redeploy**.

## 4. Before announcing the store

- [ ] Fill in your real email, phone/WhatsApp and social links in `src/config/store.ts`
      (empty ones are hidden; nothing fake is shown).
- [ ] Check delivery fee, free-delivery threshold, delivery times and return window in the same file,
      and the FAQ / policy pages (`src/routes/faq.tsx`, `src/routes/policies.$slug.tsx`).
- [ ] Log in at `/admin` → **Products**: set real stock for every size and check prices.
- [ ] Place a real test order with Paystack **test** keys (test MoMo number / test card from
      Paystack docs), check it appears in **Orders**, mark it shipped, and check `/track`.
- [ ] Switch to **live** Paystack keys, redeploy, and place one small real order.

## Day to day

- **/admin → Orders**: new paid orders appear under "To fulfil". Open one to see the address, call or
  WhatsApp the customer, and move it through *Being prepared → Out for delivery → Delivered*.
  Customers see each update (and your note) on the Track Order page.
- **Products**: change prices and stock, hide items, upload photos, add new products.
  Give a product the **TRENDING** badge to feature it on the homepage.
- **Visitors**: live activity, top pages, traffic sources, countries and devices.
- **Messages / Subscribers**: contact-form messages, newsletter sign-ups and back-in-stock
  requests (export as CSV for your email tool).
- **Refunds** are issued from the Paystack dashboard; then set the order to *Refunded* in admin.
