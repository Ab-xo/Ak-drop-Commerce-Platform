# AK Drop

AK Drop is a global-ready, multi-category commerce portfolio built with Next.js
and Supabase. It demonstrates product discovery, cart persistence, account
management, currency display, and a server-validated order workflow without
claiming a live payment or shipping service.

## At a glance

- **Web framework:** Next.js 16 App Router with React 19
- **Primary languages:** TypeScript and TSX
- **Styling:** CSS with Tailwind CSS v4
- **Backend services:** Supabase (PostgreSQL and Supabase Auth)
- **Client state:** Zustand
- **Current branch:** `main`

## Architecture

```text
Browser
  ├── Next.js pages and interactive React components
  ├── Zustand cart state
  └── Supabase browser client (@supabase/ssr)
          │
          ├── Supabase Auth
          └── PostgreSQL (catalog, profiles, orders, commerce tables)

Next.js server
  ├── Server-rendered pages and Server Actions
  ├── Route Handlers (OAuth callback and API routes)
  ├── Supabase server client using request cookies
  └── src/proxy.ts refreshes Supabase auth sessions
          │
          └── Supabase Auth and PostgreSQL, protected by RLS
```

The App Router lives in `src/app`. Pages can render on the server, while
interactive features use client components where needed. Supabase access is
shared through browser and server clients in `src/lib`; `src/proxy.ts` keeps
cookie-based sessions refreshed. Database row-level security (RLS) is part of
the data-access boundary. Do not rely on UI visibility alone to authorize
access.

## Languages and configuration

| Language / format | Where it is used |
| --- | --- |
| **TypeScript (`.ts`)** | Server and shared application logic, Supabase clients, utilities, state, and types |
| **TSX (`.tsx`)** | React UI, layouts, and Next.js pages |
| **CSS (`.css`)** | Global styles and Tailwind CSS utilities |
| **SQL (`.sql`)** | Supabase/PostgreSQL schema and row-level security policies |
| **JSON (`.json`)** | npm metadata, TypeScript settings, and other tool configuration |
| **JavaScript modules (`.mjs`)** | PostCSS and ESLint configuration |

This repository does not use the legacy PHP/MySQL runtime. The application is
TypeScript/React; SQL is used only for the PostgreSQL database setup.

## Technology stack

| Area | Technology |
| --- | --- |
| Framework and routing | Next.js 16.1.6 App Router |
| UI | React 19.2, TypeScript 5 |
| Styling | Tailwind CSS v4, PostCSS |
| Backend | Supabase PostgreSQL, Auth, and `@supabase/ssr` |
| Client state | Zustand |
| Animation | Framer Motion, GSAP |
| Icons and feedback | Lucide React, React Icons, Sonner, React Hot Toast |
| Validation | Zod |
| Quality tools | ESLint 9, TypeScript |

## Features

- Multi-category product browsing, search, filters, sorting, and pagination
- Product detail pages and persistent shopping cart
- ETB, USD, EUR, GBP, and CAD display options with illustrative portfolio rates
- Country-aware delivery-address capture for future shipping integrations
- Email/password and Google OAuth authentication through Supabase
- User profile and order-history views
- Stripe test-mode Checkout for card payments, including Mastercard, with required billing-address collection
- ETB order records and USD test charges using the storefront's fixed illustrative rate; shipping fulfillment is not connected
- Light and dark themes
- Responsive layouts and animated storefront components

## Getting started

### Requirements

- Node.js compatible with the installed Next.js version
- npm
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/Ab-xo/Ak-drop-Commerce-Platform.git
cd Ak-drop-Commerce-Platform
```

The active branch is `main`.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase

Copy the environment template:

```powershell
Copy-Item .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the
project URL and anon/publishable key from **Supabase Dashboard → Project
Settings → API**. Set `NEXT_PUBLIC_SITE_URL` to the local or deployed site URL.
These are public-client settings; never put a service-role key in a
`NEXT_PUBLIC_` variable. Restart the dev server after changing `.env.local`.
For checkout, also set `SUPABASE_SERVICE_ROLE_KEY` to the server-only key from
Supabase and `STRIPE_SECRET_KEY` to a Stripe **test** secret key (`sk_test_`).
Never expose either secret through a `NEXT_PUBLIC_` variable or commit them.
Optionally set `NEXT_PUBLIC_SUPPORT_EMAIL` to a real contact address for your
deployment. The contact form remains disabled when no support email is set.

### 4. Set up the database

Run [`database/setup.sql`](./database/setup.sql) in the Supabase SQL Editor.
This is the repository's sole SQL setup file and creates the profile, catalog,
order, and commerce tables with row-level security policies. It intentionally
does not insert sample products or categories. Add catalog data before using
the shop.

[`database/create-product.sql`](./database/create-product.sql) updates the
existing Urban Commuter Backpack (`AK-BG-001`) with four public gallery image
URLs; it does not insert a duplicate. Run it in the Supabase SQL Editor to
replace that product's current single-image gallery. Product prices are stored
in ETB; the storefront's USD display and Stripe test charge use the documented
illustrative conversion rate.

The secure admin sign-in is available at `/admin/login`, and the protected
store dashboard is at `/admin`. Create or reset the staff user's password in
Supabase Dashboard → **Authentication → Users**; never insert `auth.users`
manually or put credentials in this repository. In `database/setup.sql`, replace
`REPLACE_WITH_ADMIN_EMAIL` in the optional admin-provisioning block with that
existing user's email, then run the full setup file in Supabase SQL Editor. The
block is a no-op while the placeholder remains and merges the server-managed
`app_metadata.role = "admin"` claim without replacing other claims. After
provisioning, sign out and back in so the refreshed session contains the role.
To revoke admin access, remove the `role` key from that user's App Metadata in
Supabase Dashboard, or run this in SQL Editor with the user's email substituted:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) - 'role',
    updated_at = NOW()
WHERE lower(email) = lower('STAFF_EMAIL_HERE')
  AND raw_app_meta_data->>'role' = 'admin';
```

Never use editable `user_metadata` or a client-side flag for staff
authorization. The dashboard summarizes the live catalog, recent orders,
customer count, low-stock products, and galleries that still need images. The
product editor is available at `/admin/products`. Rerun the latest
`database/setup.sql` to create/update the public-read-only `product-images`
bucket. Admin uploads go through a server action using the server-only
Supabase service-role key; accepted uploads are JPEG, PNG, WebP, or AVIF up to
6 MB. The editor requires four distinct gallery URLs before saving. The catalog
flags existing products with fewer than four distinct images so staff can add
accurate photos for each item.

Checkout also requires the PostgreSQL functions defined in this SQL file.
Rerun the latest setup SQL in the same Supabase project configured by
`.env.local`; this installs the Stripe payment-session fields and trusted
payment-status functions, then refreshes PostgREST's schema cache. Orders are
created and inventory is reserved before payment; failed session creation or
expired checkout releases the reservation. Stripe webhooks, not browser
redirect parameters, confirm payment status.

Run Stripe's CLI to forward test events locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the CLI's `whsec_...` value to `STRIPE_WEBHOOK_SECRET`. Configure the same
`/api/stripe/webhook` endpoint in Stripe for deployed test environments and
subscribe to `checkout.session.completed` and `checkout.session.expired`.
Checkout redirects to Stripe-hosted card entry, accepts card networks such as
Mastercard, and requires a billing address. Use Stripe's official test card
details only; the server rejects live (`sk_live_`) keys.

Product/order values remain stored in ETB. Stripe test payments are charged in
USD using the same fixed illustrative USD rate shown in the storefront; these
are test transactions, not a live FX quote. Delivery is not included and no
shipment is arranged. Production payments require an explicitly supported
settlement currency, trusted exchange rates, shipping coverage, and a
fulfillment process. The same setup creates customer notifications and adds an
unread notification for each existing order; read and delete actions are
stored in Supabase and reflected by the navbar badge.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Repository structure

```text
.
├── database/
│   ├── setup.sql                 # Canonical Supabase schema and RLS policies
│   └── create-product.sql        # Updates the backpack to a four-image gallery
├── public/                       # Static assets
├── src/
│   ├── app/                      # App Router pages, layouts, and Route Handlers
│   │   ├── api/                  # API endpoints
│   │   ├── auth/                 # Sign-in, sign-up, and OAuth callback routes
│   │   ├── account/              # Customer account pages
│   │   ├── cart/                 # Cart page
│   │   ├── categories/           # Category browsing
│   │   └── shop/                 # Catalog and product details
│   ├── components/
│   │   ├── account/              # Profile, orders, notifications, settings
│   │   ├── cart/                 # Cart UI
│   │   ├── layout/               # Navbar, footer, hero, profile menu
│   │   ├── providers/            # Theme and Supabase providers
│   │   └── ui/                   # Shared UI components
│   ├── hooks/                    # Shared React hooks
│   ├── lib/                      # Supabase clients, auth, and server actions
│   ├── store/                    # Zustand cart store
│   ├── types/                    # Shared TypeScript domain types
│   ├── utils/                    # Data fetching and utility helpers
│   └── proxy.ts                  # Supabase auth session refresh
├── .env.example                  # Environment variable template
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS/Tailwind integration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── PROJECT_ROADMAP.md            # Capability review and implementation plan
```

## Project plan

See [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) for the legacy-project
comparison, current gaps, phased implementation plan, and acceptance criteria.

## License

MIT
