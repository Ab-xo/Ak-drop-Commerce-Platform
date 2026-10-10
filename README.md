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
git clone https://github.com/Ab-xo/Ak-Footwear-Ecommerce.git
cd Ak-Footwear-Ecommerce
git checkout feat/ak-drop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Apply the database schema

Run `complete-schema.sql` in your Supabase project's SQL Editor.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
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
