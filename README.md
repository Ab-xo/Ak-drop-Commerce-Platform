# AK Drop

> Premium sneakers, streetwear & accessories — exclusive drops, curated collections, delivered fast.

AK Drop is a modern full-stack marketplace built with **Next.js 16**, **Supabase**, **Tailwind CSS v4**, and **Framer Motion**. It is the modern rewrite of the AK Footwear Ecommerce project, expanded from a footwear store into a full multi-category drop culture marketplace.

---

## Tech Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Framework     | Next.js 16.1.6 (App Router, Turbopack) |
| Language      | TypeScript 5                           |
| Styling       | Tailwind CSS v4                        |
| Animation     | Framer Motion + GSAP                   |
| Backend       | Supabase (PostgreSQL + Auth + Storage) |
| State         | Zustand                                |
| UI            | Lucide React + React Icons             |
| Notifications | Sonner + React Hot Toast               |

---

## Features

- Multi-category catalog — Footwear, Apparel, Accessories, and more
- Full authentication — Email/Password + Google OAuth (Supabase Auth)
- User profiles with avatar, address, and preferences
- Shopping cart with persistent state (Zustand)
- Product filtering, search, sort, and pagination
- Dark / Light theme toggle
- Animated hero slider (Framer Motion + GSAP) and page transitions
- Order history dashboard
- Responsive — mobile-first design
- Server Components + Client Components architecture

---

## Getting Started

### 1. Clone and checkout

```bash
git clone https://github.com/Ab-xo/Ak-drop-Commerce-Platform.git
cd Ak-drop-Commerce-Platform
git checkout feat/ak-drop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```powershell
Copy-Item .env.example .env.local
```

Replace the sample Supabase URL and key with the project URL and anon/publishable
key from **Supabase Dashboard → Project Settings → API**. Do not leave the
sample values in place. Restart `npm run dev` after changing `.env.local`.

The storefront reads products from Supabase. Ensure the database schema and
product data are present in the configured project before opening the shop.

### 4. Apply the database schema

Run [`database/setup.sql`](./database/setup.sql) in your Supabase project's SQL
Editor. It is the single canonical setup file; it creates the profile, catalog,
order, and commerce tables and applies customer-safe RLS policies. It contains
no sample product/category data, so populate the catalog with your store's data
before opening the shop. The schema is designed to be rerun and does not delete
existing table data.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
database/
└── setup.sql              # Canonical Supabase schema and access policies
PROJECT_ROADMAP.md         # Legacy comparison and incremental delivery plan
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Home / landing
│   ├── shop/             # Product catalog + detail
│   ├── categories/       # Category browsing
│   ├── account/          # User dashboard
│   ├── auth/             # Sign in / sign up / OAuth callback
│   ├── cart/             # Cart page
│   ├── orders/           # Order history
│   └── api/              # API route handlers
├── components/
│   ├── layout/           # Navbar, Footer, Hero
│   ├── ui/               # ProductCard, ThemeToggle, etc.
│   ├── cart/             # CartDrawer
│   ├── account/          # Account dashboard components
│   └── providers/        # ThemeProvider, SupabaseProvider
├── lib/                  # Supabase clients (browser + server)
├── store/                # Zustand stores (cart)
├── types/                # TypeScript types
└── utils/                # Supabase fetch helpers
```

---

## Branch Strategy

| Branch         | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `master`       | Original AK Footwear (legacy)                           |
| `feat/ak-drop` | AK Drop — modern full marketplace rewrite (this branch) |

---

## License

MIT
