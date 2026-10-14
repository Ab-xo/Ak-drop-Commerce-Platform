# AK Drop Modernization Roadmap

## Purpose

Use the legacy AK Footwear PHP/MySQL storefront as a product-history and feature
reference while finishing AK Drop Modern as a reliable, multi-category
e-commerce application. Port useful customer and operations workflows; do not
copy the old implementation's security, payment, currency, or data-integrity
shortcuts.

## Review summary

The legacy application is a PHP/HTML/Bootstrap storefront backed by MySQL. Its
strongest product ideas are a footwear catalog with new/release groupings,
search and price filtering, paginated listings, product image galleries and
shoe-size selection, a session cart, shipping details, account/order pages, and
an administrator area for products and orders.

AK Drop Modern has moved beyond the footwear-only identity: products are read
from Supabase, categories are first-class, and the homepage, shop, product
details, account, and theme have a modern responsive interface. The database
scripts also anticipate variants, order items, payments, coupons, reviews,
wishlists, contact submissions, newsletter subscribers, and blog posts.
However, some of those are schema-only, incomplete UI, or presentation-only.
The most important gap is end-to-end checkout: the modern cart's checkout
control is not connected to a checkout route, and the customer-facing order
screens do not yet have a completed order-placement/payment path.

### Capability comparison

| Capability | Legacy PHP project | AK Drop Modern today | Roadmap assessment |
|---|---|---|---|
| Catalog scope | Footwear products with category, arrival/release flags, stock, and product images | Home, shop, categories, and product detail backed by Supabase; schema supports broader category/product data | Keep the multi-category direction. Make the categories page and catalog use the same live Supabase categories. |
| Home merchandising | Release and new-arrival product sections; promotional banners | Featured, new arrival, deals, category blocks, and hero | Preserve the stronger modern layout; ensure each merchandising block has intentional empty/error states and no placeholder claims. |
| Search and browse | Shop search/category-like matching, min/max price filtering, eight-item pagination | Name search, category selection, price filter, sorting, six-item client-side pagination | Improve filter correctness and URL-state/shareability; move large-catalog filtering and pagination to the data query. |
| Product details | Multiple shoe images, details, shoe size, quantity, related-product section | Product image gallery, description/features, stock, add-to-cart; no selected size/color or variant-specific stock | Add a real product-variant model and selection; only add items with valid available variants. |
| Cart | Session-backed cart; item quantity and size; checkout summary | Persisted Zustand cart and drawer/page; line quantity and remove actions | Keep cart persistence, but reconcile stale products/prices and stock before order creation. The checkout button currently has no flow. |
| Checkout and payment | Shipping/contact form, order placement, PayPal payment attempt | No checkout page/order-creation flow; order/payment tables are present in SQL | Critical gap. Build server-authoritative order creation, payment initiation, verified payment updates, and confirmation. |
| Customer account | Login/signup, profile update, order list and order details | Supabase authentication, profile editor, account summary/tabs, order display | Retain; connect account orders to real order-item details and restore usable links to detail pages. Persist settings rather than showing local-only toggles. |
| Admin and operations | Admin sign-in, product create/edit/delete and image edit, order list/status edit/delete, customer screens | No admin routes or role-gated catalog/order operations | Build a protected operational console after checkout/order contracts are established. |
| Promotions | Static promotion/season banners; no dependable promotion engine evident in reviewed pages | Deals derived from compare price; coupon schema exists but no checkout integration | Implement discounts only after subtotal/currency/tax/shipping rules exist; validate every coupon on the server. |
| Content and acquisition | Static blog page and newsletter verification flow | Blog/newsletter schema exists; no published blog/newsletter flow found in app pages | Add only after order-critical flows. Replace legacy inline SMTP credentials and unsafe email rendering with managed secrets and validated server-side handlers. |
| Contact/support | Contact page, phone/address/map, externally submitted form | Contact information and a client-only “sent” state; contact-submission schema exists | Persist submissions or use an explicitly configured support integration; never show success before durable submission. |
| Currency and localization | UI mixes ETB and USD; payment SDK is configured for USD | Product cards show ETB, but cart/order displays include dollar formatting | Establish ETB as the storefront's canonical display currency unless business requirements specify otherwise. Keep provider settlement/conversion explicit. |

## Modernization principles

1. **Preserve the multi-category product model.** Footwear remains a first-class
   category, not the entire catalog. Categories, products, and variants must be
   data-driven rather than hard-coded to shoes or sample counts.
2. **The server owns commerce truth.** The browser may hold a convenience cart,
   but the server must reload active product/variant prices and stock before
   creating an order. Never trust client-supplied totals, prices, status, or
   payment success.
3. **Use a consistent money contract.** Store currency with monetary amounts;
   display ETB consistently on storefront and customer screens. Do not silently
   pass ETB amounts to a USD-only provider.
4. **Port business workflows, not legacy defects.** The old payment completion
   handler accepts transaction data from a browser redirect, and its newsletter
   implementation contains credentials in application source. Use provider
   server verification/webhooks, environment-managed secrets, input validation,
   and authorization policies instead.
5. **Every visible action has a real outcome.** A button must navigate, persist,
   submit, or be explicitly marked unavailable. Do not report a success state
   for a client-only no-op.
6. **Make data access and failures explicit.** Use typed server-side data
   boundaries, clear empty/error/loading states, RLS policies, and integration
   tests against a documented schema.

## Incremental implementation plan

### Phase 0 — Baseline and data contract

**Priority:** P0 — prerequisite for the commerce phases.

**Scope**

- Keep one canonical Supabase setup entry point at `database/setup.sql`.
  Reconcile product, category, order, variant, and payment changes there until
  a versioned migration workflow is deliberately introduced.
- Verify policies and permissions for public catalog reads, authenticated
  customer data, and staff-only writes. Admin access must be based on a
  server-verified role, not a hidden link or client-side flag.
- Introduce typed domain contracts for product/variant, cart line, order,
  order item, address, payment, and money/currency.
- Add focused tests for money formatting, cart reconciliation, order totals,
  and allowed order-status transitions.
- Inventory all visible placeholder actions and remove misleading success
  messages as each surface is implemented.

**Acceptance criteria**

- A clean Supabase setup can apply `database/setup.sql` without relying on
  ambiguous script ordering; catalog data is managed separately from schema.
- Product, order, and payment amounts have documented units and currency.
- Tests cover zero stock, inactive products, malformed prices, and unavailable
  variants.

### Phase 1 — Complete the customer purchase journey

**Priority:** P0 — highest business value.

**Scope**

1. Replace the cart's inert checkout button with a real `/checkout` route.
2. Collect and validate customer name, email, phone, delivery address, city,
   and any Ethiopian-region/postal fields required by the chosen delivery
   process. Prefill authenticated customer details where available.
3. Revalidate cart product IDs, active status, prices, variant availability,
   quantities, and stock on the server. Reject stale or over-stock cart lines
   with a clear correction path.
4. Calculate subtotal, shipping, discounts, tax/VAT if applicable, and total
   on the server. Store immutable order-item snapshots (product name/SKU,
   image, selected options, unit price, and quantity) so later catalog edits do
   not rewrite an order.
5. Create the order and reserve/decrement inventory atomically using a
   transaction or Postgres RPC with concurrency-safe stock checks. Prevent
   duplicate submissions with an idempotency key.
6. Present an order confirmation and status screen; support account order
   history and `/orders/[id]` detail pages with server-side ownership checks.
7. Add payment initiation and a provider callback/webhook only after provider,
   currency, settlement, and local payment-method requirements are confirmed.
   Verify provider events server-to-server and make event handling idempotent.
8. Define a state machine, for example:
   `pending_payment -> paid -> processing -> shipped -> delivered`, with
   explicit `payment_failed`, `cancelled`, and `refunded` paths. Do not allow
   the browser to set these statuses.
9. Standardize currency display across product, cart, checkout, account, and
   order views. Store provider settlement currency separately where conversion
   is needed.

**Acceptance criteria**

- A customer can add a product, complete delivery details, place an order,
  return after refresh, and see the same order and item snapshots.
- Tampering with browser prices/totals, reusing a payment callback, or ordering
  beyond current stock cannot create a paid or over-stock order.
- Payment success/failure appears only after verified provider status.
- Customers cannot retrieve another customer's order by changing a URL.
- Empty cart, expired session, out-of-stock, payment-pending, and failed-payment
  states are all recoverable and understandable.

**Decision gate:** Confirm the payment provider(s), ETB collection/settlement
rules, and whether guest checkout is required before implementing provider
integration. Keep the payment adapter replaceable so the provider decision does
not leak into product/cart UI.

### Phase 2 — Product options and inventory correctness

**Priority:** P1 — required for footwear sizing and reliable stock.

**Scope**

- Connect the existing `product_variants` concept to product detail, cart, and
  checkout. Support relevant attributes (shoe size, apparel size, color, and
  SKU) without imposing shoe sizes on every category.
- Define variant-specific price overrides, stock, active status, and optional
  images only where the business needs them.
- Show available options; disable unavailable combinations; require a valid
  selection before adding a variant-required product to cart.
- Show inventory availability in the UI without exposing sensitive inventory
  details if business policy does not permit it.
- Reconcile persisted carts when product/variant data has changed.

**Acceptance criteria**

- Two shoppers cannot successfully purchase the last unit of the same variant.
- Cart lines distinguish different sizes/colors of the same product.
- Products without options remain purchasable without a fake variant.
- Product gallery handles zero, one, or many valid images and missing image
  URLs.

### Phase 3 — Admin catalog, order, and customer operations

**Priority:** P1 — required to operate a live store.

**Scope**

- Add `/admin` login/authorization using a server-verified staff role and
  deny-by-default route/data access.
- Add searchable, paginated product and category management: create, edit,
  deactivate/archive, assign categories, manage prices/compare-at prices,
  features/tags, SEO fields, product images, and variants/stock.
- Upload images to Supabase Storage with file type/size validation, stable
  storage paths, cleanup of replaced assets, and image preview/reordering.
- Add order queue and order detail with customer delivery data, item snapshots,
  payment status, fulfillment state, and a status-change audit trail.
- Enforce valid transitions and require a reason for cancellation/refund or
  manual status overrides.
- Add customer lookup with privacy-limited fields and auditable support access.
- Add dashboard metrics based on real order/payment data (sales, open orders,
  low stock, recent activity). Avoid copying the legacy dashboard's hard-coded
  sample chart and order values.

**Acceptance criteria**

- Anonymous and customer accounts cannot access staff pages or mutation APIs.
- Staff actions are validated server-side and recorded with actor, timestamp,
  previous state, and new state.
- Product edits are reflected on the public catalog; existing order snapshots
  remain unchanged.
- Product/order list filtering and pagination work with realistic catalog size.

### Phase 4 — Discovery, promotions, saved products, and reviews

**Priority:** P2 — customer retention and conversion.

**Scope**

- Make category browsing data-driven and consistent between home, categories,
  and shop. Standardize category slugs rather than maintaining hard-coded
  alternatives.
- Persist search/category/price/sort/page state in URL parameters. Add product
  brand, size, color, availability, and price facets only when catalog data is
  populated for those fields.
- Implement coupon validation, eligibility, expiry, usage limits, and discount
  calculation server-side; persist coupon application on order creation.
- Connect the wishlist schema to authenticated customer actions and a saved
  items view; provide accessible sign-in prompts for anonymous users.
- Connect product reviews to verified purchase eligibility, moderation, rating
  aggregation, and abuse reporting. Replace static five-star decorations with
  real aggregate ratings or clearly labelled placeholders.
- Add related products based on category/tags/variant and exclude the current
  product.

**Acceptance criteria**

- Filter links can be bookmarked/shared and survive reload/back navigation.
- Coupon totals match server calculations and cannot exceed configured rules.
- A customer can only create one permitted review per eligible product/order
  according to the agreed review policy.
- Product rating displays match approved review data.

### Phase 5 — Newsletter, editorial content, and support workflows

**Priority:** P2 — after ordering and staff operations work.

**Scope**

- Persist contact submissions and provide staff visibility/status, or configure
  a named support provider. Show success only after a successful server
  response.
- Implement newsletter double opt-in, unsubscribe, resubscribe, and suppression
  handling with token expiry and rate limits. Keep SMTP/provider credentials
  in server-only environment variables.
- Build blog listing/detail pages backed by published records, with pagination,
  metadata, accessible images, and admin publishing workflow.
- Add transactional email templates for order confirmation, payment receipt,
  status updates, password recovery, and newsletter verification. Prefer
  delivery outbox/retry tracking over sending from client code.
- Review business details (address, hours, support links) for consistency
  across contact page and footer.

**Acceptance criteria**

- Contact and subscription submissions are validated, rate-limited, and
  persisted; duplicate subscriptions are handled idempotently.
- Unpublished blog content is not publicly readable.
- Failed email delivery is logged/retriable without falsely reporting email
  success to the customer.

### Phase 6 — Production readiness and launch

**Priority:** P1 before public launch; run in parallel with Phases 1–5 where
possible.

**Scope**

- Add end-to-end smoke coverage for catalog -> cart -> checkout -> verified
  payment -> account order history, plus admin product/order tasks.
- Add responsive/accessibility checks, keyboard navigation, form error
  summaries, image loading/fallbacks, reduced-motion checks, and contrast
  verification in both themes.
- Add structured server logs and safe operational metrics for database,
  payment webhook, and email failures. Do not log passwords, payment secrets,
  full payment tokens, or unnecessary personal data.
- Set deployment secrets, production redirect URLs, Supabase RLS, storage
  policies, backups, webhook secrets, and domain/email configuration.
- Add abuse controls: rate limits, input/schema validation, CSRF-safe mutation
  paths where relevant, file upload restrictions, and audit logs.
- Review SEO metadata, canonical URLs, sitemap/robots behavior, legal/refund
  policies, delivery coverage, and VAT/pricing disclosures.
- Add a launch checklist and a rollback plan for database migrations and
  payment changes.

**Acceptance criteria**

- Production build, focused unit/integration tests, lint, and end-to-end smoke
  tests pass in CI.
- Staging checkout exercises payment success, rejection, duplicate webhook,
  timeout, cancellation, and inventory contention.
- No production credentials are committed or sent to the browser beyond public
  keys intended for browser use.

## Suggested delivery order

1. **Phase 0** — reconcile schema and money/security contracts.
2. **Phase 1** — ship a complete customer order flow; confirm payment/currency
   decisions before provider work.
3. **Phase 2** — wire variants and concurrency-safe inventory (can begin with
   order contract design).
4. **Phase 3** — give staff tools to operate catalog and fulfill orders.
5. **Phase 6 launch controls** — complete minimum production checks before
   public transactions; do not defer security or payment verification to the
   end.
6. **Phase 4** — improve discovery and retention.
7. **Phase 5** — activate newsletter, blog, and support automation.

## Repository structure

- `src/app/` — Next.js routes, storefront pages, and API handlers.
- `src/components/` — shared layout, catalog, account, cart, and provider UI.
- `src/lib/`, `src/store/`, `src/types/`, `src/utils/` — backend clients,
  state, domain types, and shared data helpers.
- `database/setup.sql` — the sole SQL setup file for schema and access policies;
  it intentionally contains no sample catalog data.
- `PROJECT_ROADMAP.md` — capability review, priorities, scope, and acceptance
  criteria for future implementation.
- `.env.example` — required environment-variable template; real local secrets
  remain in the ignored `.env.local`.

## Legacy project references reviewed

- [Legacy repository README](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/README.md) — PHP/MySQL/XAMPP setup.
- [Legacy home page](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/index.php) — release/new-arrival sections and promotional layout.
- [Legacy shop page](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/shop.php) — product search/filter and pagination.
- [Legacy product detail](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/Sproducts.php) — image gallery, shoe size, quantity, and product details.
- [Legacy cart](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/cart.php) and [checkout](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/checkout.php) — session cart and delivery form.
- [Legacy account](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/account.php) and [order detail](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/orderdetail.php) — profile and order history.
- [Legacy admin products](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/admin/products.php), [admin orders](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/admin/orders.php), and [admin overview](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/admin/index.php) — catalog/order tools and dashboard concept.
- [Legacy schema](https://github.com/Ab-xo/Ak-Footwear-Ecommerce/blob/master/Database/shoe.sql) — original MySQL product/order/payment data model.
- [Modern application](./src/app) and [canonical Supabase setup](./database/setup.sql) — current implementation and database capabilities.

This is an implementation specification, not a claim that every schema object
is deployed or every listed legacy page was production-safe. Apply the
canonical setup to the intended Supabase project and verify its schema before
building additional features.
