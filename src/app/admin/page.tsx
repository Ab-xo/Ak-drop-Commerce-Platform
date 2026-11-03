import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight, Boxes, CheckCircle2, CircleAlert, Clock,
  PackageCheck, Package, ShoppingBag, Truck, Users, TrendingUp,
  Plus, ListOrdered, UserSearch,
} from 'lucide-react';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-US')}`;
  }
}

function orderStatusBadge(status: string) {
  if (status === 'delivered') return <Badge variant="success" className="capitalize">{status}</Badge>;
  if (status === 'shipped') return <Badge variant="info" className="capitalize">{status}</Badge>;
  if (status === 'processing') return <Badge variant="purple" className="capitalize">{status}</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive" className="capitalize">{status}</Badge>;
  return <Badge variant="warning" className="capitalize">{status}</Badge>;
}

// ─── SVG bar chart (pure, no deps) ───────────────────────────────────────────
function RevenueBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 320; const H = 80; const gap = 6;
  const barW = (W - gap * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" aria-label="Daily revenue chart">
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * H);
        const x = i * (barW + gap);
        const y = H - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx={3}
              className="fill-primary/70 transition-all duration-500 hover:fill-primary" />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle"
              className="fill-muted-foreground text-[9px]" fontSize={9}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) redirect('/admin/login');

  const admin = createAdminClient();

  const reportNow = Date.now();
  const today = new Date(reportNow);
  today.setUTCHours(0, 0, 0, 0);
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
  const [
    totalProductsResult,
    activeProductsResult,
    lowStockResult,
    inStockResult,
    recentOrdersResult,
    customerCountResult,
    paidOrdersResult,
    statusCountResults,
  ] = await Promise.all([
    admin.from('products').select('id', { count: 'exact', head: true }),
    admin.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('products').select('id', { count: 'exact', head: true })
      .eq('is_active', true).eq('track_quantity', true).lte('quantity', 5),
    admin.from('products').select('id', { count: 'exact', head: true })
      .eq('is_active', true).or('track_quantity.is.null,track_quantity.eq.false,quantity.gt.0'),
    admin.from('orders')
      .select('id, order_number, status, payment_status, total_amount, currency, created_at')
      .order('created_at', { ascending: false }).limit(8),
    admin.from('user_profiles').select('id', { count: 'exact', head: true }),
    admin.from('orders').select('total_amount, created_at')
      .eq('payment_status', 'paid').eq('currency', 'ETB').gte('created_at', sixDaysAgo.toISOString()),
    Promise.all(orderStatuses.map((status) =>
      admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', status),
    )),
  ]);

  const queryResults = [
    ['total product count', totalProductsResult],
    ['active product count', activeProductsResult],
    ['low-stock product count', lowStockResult],
    ['in-stock product count', inStockResult],
    ['recent orders', recentOrdersResult],
    ['customer count', customerCountResult],
    ['seven-day paid revenue', paidOrdersResult],
  ] as const;
  for (const [label, result] of queryResults) {
    if (result.error) {
      console.error(`Admin dashboard ${label} query failed:`, result.error.message);
      throw new Error('Unable to load store analytics.');
    }
  }
  statusCountResults.forEach((result, index) => {
    if (result.error) {
      console.error(`Admin dashboard ${orderStatuses[index]} order count failed:`, result.error.message);
      throw new Error('Unable to load store analytics.');
    }
  });

  const galleryProducts: { images: unknown }[] = [];
  const galleryPageSize = 1000;
  for (let from = 0; ; from += galleryPageSize) {
    const { data, error } = await admin.from('products').select('images').range(from, from + galleryPageSize - 1);
    if (error) {
      console.error('Admin dashboard catalog health query failed:', error.message);
      throw new Error('Unable to load catalog health.');
    }
    const page = data ?? [];
    galleryProducts.push(...page);
    if (page.length < galleryPageSize) break;
  }

  // ── product metrics ──
  const totalProducts = totalProductsResult.count ?? 0;
  const activeProducts = activeProductsResult.count ?? 0;
  const lowStock = lowStockResult.count ?? 0;
  const inStock = inStockResult.count ?? 0;
  const customerCount = customerCountResult.count ?? 0;
  const incompleteGalleries = galleryProducts.filter((p) => {
    const imgs = Array.isArray(p.images) ? p.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0) : [];
    return imgs.length < 4;
  }).length;
  const completeGalleries = galleryProducts.length - incompleteGalleries;
  const galleryPct = galleryProducts.length ? Math.round((completeGalleries / galleryProducts.length) * 100) : 0;

  // ── order metrics ──
  const recentOrders = recentOrdersResult.data ?? [];
  const ordersByStatus = Object.fromEntries(
    statusCountResults.map((result, index) => [orderStatuses[index], result.count ?? 0]),
  ) as Record<(typeof orderStatuses)[number], number>;
  const fulfillmentQueue = (ordersByStatus['pending'] ?? 0) + (ordersByStatus['processing'] ?? 0);

  // ── revenue last 7 days ──
  const revenueByDay: Record<string, number> = {};
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    revenueByDay[key] = 0;
    dayKeys.push(key);
  }
  (paidOrdersResult.data ?? []).forEach((o) => {
    const day = o.created_at.slice(0, 10);
    if (revenueByDay[day] !== undefined) revenueByDay[day] += Number(o.total_amount);
  });
  const chartData = dayKeys.map((key) => ({
    label: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${key}T00:00:00Z`)),
    value: revenueByDay[key],
  }));
  const totalRevenue7d = Object.values(revenueByDay).reduce((s, v) => s + v, 0);

  // ── inStock rate ──
  const inStockRate = activeProducts ? Math.round((inStock / activeProducts) * 100) : 0;

  const PIPELINE = [
    { status: 'pending', label: 'Paid · Awaiting', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
    { status: 'processing', label: 'Processing', color: 'text-sky-500', bg: 'bg-sky-500/10', icon: Package },
    { status: 'shipped', label: 'Shipped', color: 'text-violet-500', bg: 'bg-violet-500/10', icon: Truck },
    { status: 'delivered', label: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    { status: 'cancelled', label: 'Cancelled', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: CircleAlert },
  ] as const;

  const KPI = [
    { label: 'Active products', value: activeProducts, note: `${totalProducts} total in catalog`, icon: Boxes, grad: 'from-violet-500 to-fuchsia-500', tint: 'bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400' },
    { label: 'Orders to fulfill', value: fulfillmentQueue, note: 'Pending + processing', icon: PackageCheck, grad: 'from-amber-500 to-orange-400', tint: 'bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Customers', value: customerCount ?? 0, note: 'Registered profiles', icon: Users, grad: 'from-sky-500 to-cyan-400', tint: 'bg-sky-500/10', iconColor: 'text-sky-600 dark:text-sky-400' },
    { label: '7-day revenue', value: fmt(totalRevenue7d, 'ETB'), note: 'Paid orders (ETB)', icon: TrendingUp, grad: 'from-emerald-500 to-teal-400', tint: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400', isText: true },
  ];

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="overview">
      <div className="space-y-7">

        {/* ── Welcome banner ── */}
        <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-border/80 bg-card shadow-sm">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.13),transparent_55%)]" />
          <div className="relative flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur">
                <span className="size-1.5 rounded-full bg-primary" /> Store control center
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-[2.6rem]">Your store, at a glance.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Monitor catalog health, move orders through fulfillment, and keep customers informed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Link href="/admin/products" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95">
                <Plus size={16} /> Add product
              </Link>
              <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-primary/30 hover:text-primary">
                <ListOrdered size={16} /> Orders queue
              </Link>
              <Link href="/admin/customers" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-primary/30 hover:text-primary">
                <UserSearch size={16} /> Customers
              </Link>
            </div>
          </div>
        </section>

        {/* ── KPI cards ── */}
        <section aria-label="Store KPIs" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {KPI.map(({ label, value, note, icon: Icon, grad, tint, iconColor, isText }) => (
            <Card key={label} className="group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${grad}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                    <p className={`mt-2 font-black tracking-tight tabular-nums ${isText ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
                  </div>
                  <span className={`rounded-2xl p-3.5 transition-transform duration-200 group-hover:scale-105 ${tint}`}>
                    <Icon size={19} className={iconColor} />
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary/60" /> {note}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* ── Order pipeline kanban strip ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Order pipeline</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {PIPELINE.map(({ status, label, color, bg, icon: Icon }) => (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
              >
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>
                  <Icon size={17} className={color} />
                </div>
                <p className="text-2xl font-black tabular-nums">{ordersByStatus[status] ?? 0}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Main content: orders table + right panel ── */}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.75fr)]">

          {/* Recent orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag size={17} className="text-primary" /> Recent orders
                <span className="ml-auto rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {recentOrders.length} shown
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recentOrders.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-bold">Order</th>
                        <th className="px-3 py-3 font-bold">Date</th>
                        <th className="px-3 py-3 font-bold">Payment</th>
                        <th className="px-3 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-secondary/25 transition-colors">
                          <td className="px-4 py-3.5">
                            <Link href={`/admin/orders/${order.id}`} className="font-bold hover:text-primary transition-colors">
                              #{order.order_number}
                            </Link>
                          </td>
                          <td className="px-3 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-3 py-3.5">
                            {order.payment_status === 'paid'
                              ? <Badge variant="success">Paid</Badge>
                              : <Badge variant="secondary" className="capitalize">{order.payment_status}</Badge>}
                          </td>
                          <td className="px-3 py-3.5">{orderStatusBadge(order.status)}</td>
                          <td className="px-4 py-3.5 text-right text-xs font-bold tabular-nums">
                            {fmt(Number(order.total_amount), order.currency || 'ETB')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <ShoppingBag size={28} className="mb-3 text-muted-foreground/50" />
                  <p className="font-bold">No orders yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Orders appear here when customers check out.</p>
                </div>
              )}
              {recentOrders.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <Link href="/admin/orders" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    View all orders <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right panel */}
          <div className="space-y-5">

            {/* Revenue chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp size={16} className="text-primary" /> Revenue · last 7 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black tabular-nums">{fmt(totalRevenue7d, 'ETB')}</p>
                <p className="mb-4 mt-0.5 text-xs text-muted-foreground">From paid orders only</p>
                <RevenueBarChart data={chartData} />
              </CardContent>
            </Card>

            {/* Inventory attention */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  {lowStock ? <CircleAlert size={16} className="text-amber-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-sm text-muted-foreground">
                  {lowStock
                    ? `${lowStock} active product${lowStock === 1 ? '' : 's'} at or below 5 units.`
                    : 'No products at the low-stock threshold.'}
                </p>
                <Link href="/admin/products" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  Review inventory <ArrowUpRight size={12} />
                </Link>
              </CardContent>
            </Card>

            {/* Catalog health */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <Boxes size={16} className="text-primary" /> Catalog health
                  </span>
                  <span className="text-lg font-black tabular-nums">{galleryPct}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">4-image galleries</span>
                    <span className="font-bold">{completeGalleries}/{galleryProducts.length}</span>
                  </div>
                  <Progress value={galleryPct} indicatorClassName="bg-gradient-to-r from-primary to-violet-400" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">Active products in stock</span>
                    <span className="font-bold">{inStock}/{activeProducts}</span>
                  </div>
                  <Progress value={inStockRate} indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>
                <Separator />
                <Link href="/admin/products" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  Improve catalog <ArrowUpRight size={12} />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminWorkspace>
  );
}
