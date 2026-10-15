import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  Boxes,
  Check,
  CircleAlert,
  ClipboardList,
  Image,
  PackageCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

function orderStatusClass(status: string) {
  if (status === 'delivered') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  if (status === 'cancelled') return 'bg-destructive/10 text-destructive';
  if (status === 'shipped') return 'bg-sky-500/10 text-sky-700 dark:text-sky-400';
  return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
}

function formatOrderAmount(amount: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${normalizedCurrency} ${amount.toLocaleString('en-US')}`;
  }
}

export default async function AdminDashboardPage() {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) redirect('/admin/login');

  const admin = createAdminClient();
  const [{ data: products, error: productsError }, { data: recentOrders, error: ordersError }, { count: customerCount, error: customersError }] = await Promise.all([
    admin
      .from('products')
      .select('id, quantity, track_quantity, is_active, images'),
    admin
      .from('orders')
      .select('id, order_number, status, payment_status, total_amount, currency, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    admin
      .from('user_profiles')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (productsError) {
    console.error('Admin dashboard product metrics failed:', productsError.message);
    throw new Error('Unable to load product metrics.');
  }
  if (ordersError) {
    console.error('Admin dashboard recent orders failed:', ordersError.message);
    throw new Error('Unable to load recent orders.');
  }
  if (customersError) {
    console.error('Admin dashboard customer count failed:', customersError.message);
    throw new Error('Unable to load customer metrics.');
  }

  const allProducts = products ?? [];
  const allOrders = recentOrders ?? [];
  const activeProducts = allProducts.filter((product) => product.is_active).length;
  const lowStock = allProducts.filter((product) => product.is_active && product.track_quantity && Number(product.quantity ?? 0) <= 5).length;
  const incompleteGalleries = allProducts.filter((product) => {
    const images = Array.isArray(product.images)
      ? new Set(product.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0))
      : new Set<string>();
    return images.size < 4;
  }).length;
  const fulfillmentQueue = allOrders.filter((order) => ['pending', 'processing'].includes(order.status)).length;
  const completeGalleries = allProducts.length - incompleteGalleries;
  const galleryCompletion = allProducts.length
    ? Math.round((completeGalleries / allProducts.length) * 100)
    : 0;
  const inStockProducts = allProducts.filter(
    (product) => product.is_active && (!product.track_quantity || Number(product.quantity ?? 0) > 0),
  ).length;
  const inStockRate = activeProducts ? Math.round((inStockProducts / activeProducts) * 100) : 0;

  const stats = [
    { label: 'Active products', value: activeProducts, note: `${allProducts.length} products in catalog`, icon: Boxes, iconClass: 'text-violet-600 dark:text-violet-400', tint: 'bg-violet-500/10', bar: 'from-violet-500 to-fuchsia-500' },
    { label: 'Orders to fulfill', value: fulfillmentQueue, note: 'From the 8 most recent orders', icon: PackageCheck, iconClass: 'text-amber-600 dark:text-amber-400', tint: 'bg-amber-500/10', bar: 'from-amber-500 to-orange-500' },
    { label: 'Customers', value: customerCount ?? 0, note: 'Registered customer profiles', icon: Users, iconClass: 'text-sky-600 dark:text-sky-400', tint: 'bg-sky-500/10', bar: 'from-sky-500 to-cyan-400' },
    { label: 'Galleries to finish', value: incompleteGalleries, note: 'Products with fewer than 4 images', icon: Image, iconClass: 'text-rose-600 dark:text-rose-400', tint: 'bg-rose-500/10', bar: 'from-rose-500 to-pink-400' },
  ];

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="overview">
      <div className="space-y-6 sm:space-y-7">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-border/80 bg-card shadow-sm">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_55%)]" />
          <div className="relative flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur">
                <span className="size-1.5 rounded-full bg-primary" /> Store control center
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-[2.6rem]">Your store, at a glance.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                Monitor the catalog, keep product pages polished, and stay on top of incoming orders.
              </p>
            </div>
            <Link href="/admin/products" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Boxes size={16} /> Open product studio <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

        <section aria-label="Store metrics" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {stats.map(({ label, value, note, icon: Icon, iconClass, tint, bar }) => (
            <article key={label} className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.04]">
              <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${bar}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight tabular-nums">{value.toLocaleString()}</p>
                </div>
                <span className={`rounded-2xl p-3.5 transition-transform duration-200 group-hover:scale-105 ${tint}`}><Icon size={19} className={iconClass} /></span>
              </div>
              <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className={`size-1.5 rounded-full ${value ? 'bg-primary/70' : 'bg-muted-foreground/40'}`} />
                {note}
              </p>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.8fr)]">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <header className="flex items-center justify-between gap-4 border-b border-border/80 px-5 py-5 sm:px-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-primary/10 p-2 text-primary"><ShoppingBag size={15} /></span>
                  <h2 className="font-bold tracking-tight">Recent orders</h2>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">The latest customer order activity</p>
              </div>
              <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground">{allOrders.length} shown</span>
            </header>

            {allOrders.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="bg-secondary/35 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-bold sm:px-6">Order</th>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Payment</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 text-right font-bold sm:px-6">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-5 py-4 font-bold sm:px-6">#{order.order_number}</td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold ${order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
                            <span className={`mr-1 inline-block size-1.5 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-current opacity-50'}`} />
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold capitalize ${orderStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-xs font-bold tabular-nums sm:px-6">
                          {formatOrderAmount(Number(order.total_amount), order.currency || 'ETB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <span className="mb-4 rounded-2xl border border-border bg-secondary/70 p-3.5 text-muted-foreground"><ShoppingBag size={21} /></span>
                <p className="text-sm font-bold">No orders yet</p>
                <p className="mt-1 text-xs text-muted-foreground">New customer orders will appear here.</p>
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className={`rounded-xl p-2.5 ${lowStock ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                  {lowStock ? <CircleAlert size={18} /> : <PackageCheck size={18} />}
                </span>
                <div>
                  <h2 className="font-bold tracking-tight">Inventory attention</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {lowStock ? `${lowStock} active product${lowStock === 1 ? '' : 's'} has five or fewer units.` : 'No active products are at the low-stock threshold.'}
                  </p>
                </div>
              </div>
              <Link href="/admin/products" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold transition hover:border-primary/30 hover:text-primary">
                Review inventory <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-primary" />
                    <h2 className="font-bold tracking-tight">Catalog health</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">A quick read on product readiness</p>
                </div>
                <span className="text-lg font-black tabular-nums">{galleryCompletion}%</span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Four-image galleries</span>
                    <span className="font-bold tabular-nums">{completeGalleries}/{allProducts.length}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Products with complete galleries"
                    aria-valuemin={0}
                    aria-valuemax={allProducts.length || 1}
                    aria-valuenow={completeGalleries}
                    className="h-2 overflow-hidden rounded-full bg-secondary"
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-[width] duration-700" style={{ width: `${galleryCompletion}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Active products in stock</span>
                    <span className="font-bold tabular-nums">{inStockProducts}/{activeProducts}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Active products in stock"
                    aria-valuemin={0}
                    aria-valuemax={activeProducts || 1}
                    aria-valuenow={inStockProducts}
                    className="h-2 overflow-hidden rounded-full bg-secondary"
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-[width] duration-700" style={{ width: `${inStockRate}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border/80 pt-4">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Check size={13} className="text-emerald-500" /> Live catalog data
                </span>
                <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-bold text-primary transition hover:gap-2">
                  Improve <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}
