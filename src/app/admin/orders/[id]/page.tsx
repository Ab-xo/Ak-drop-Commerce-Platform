import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Clock, CreditCard, MapPin,
  Package, PackageCheck, Truck, User,
} from 'lucide-react';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import OrderFulfillmentPanel from '@/components/admin/OrderFulfillmentPanel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { getProductImageUrl } from '@/utils/imageUtils';

// ─── helpers ────────────────────────────────────────────────────────────────

function tf(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function fmt(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${value.toLocaleString('en-US')}`;
  }
}

function paymentBadge(status: string) {
  if (status === 'paid') return <Badge variant="success">Paid</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
  if (status === 'refunded') return <Badge variant="warning">Refunded</Badge>;
  return <Badge variant="secondary" className="capitalize">{status}</Badge>;
}

function statusBadge(status: string) {
  if (status === 'delivered') return <Badge variant="success">Delivered</Badge>;
  if (status === 'shipped') return <Badge variant="info">Shipped</Badge>;
  if (status === 'processing') return <Badge variant="purple">Processing</Badge>;
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary" className="capitalize">{status}</Badge>;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, adminUser] = await Promise.all([params, getServerVerifiedAdmin()]);
  if (!adminUser || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const admin = createAdminClient();

  // Full select with variant_attributes fallback
  const fullSel = 'id, order_number, user_id, status, payment_status, payment_method, total_amount, subtotal_amount, delivery_fee_amount, total_is_final, currency, shipping_address, created_at, tracking_number, carrier, order_items(id, product_id, product_name, product_sku, product_image, quantity, unit_price, total_price, size, color, variant_attributes), payments(amount, currency, status, payment_method, failure_message, created_at)';
  const fallSel = 'id, order_number, user_id, status, payment_status, payment_method, total_amount, subtotal_amount, delivery_fee_amount, total_is_final, currency, shipping_address, created_at, tracking_number, carrier, order_items(id, product_id, product_name, product_sku, product_image, quantity, unit_price, total_price, size, color), payments(amount, currency, status, payment_method, failure_message, created_at)';

  let raw = await admin.from('orders').select(fullSel).eq('id', id).maybeSingle();
  if (raw.error && (raw.error.code === '42703' || raw.error.message?.includes('variant_attributes'))) {
    raw = await admin.from('orders').select(fallSel).eq('id', id).maybeSingle();
  }
  if (raw.error) { console.error('Admin order detail load failed:', raw.error.message); throw new Error('Unable to load this order.'); }
  if (!raw.data) notFound();

  const order = raw.data as Record<string, unknown> & {
    id: string; order_number: string; user_id: string | null;
    status: string; payment_status: string; payment_method: string | null;
    total_amount: number; subtotal_amount: number; delivery_fee_amount: number | null;
    total_is_final: boolean; currency: string; shipping_address: Record<string, unknown> | null;
    created_at: string; tracking_number: string | null; carrier: string | null;
    order_items: Record<string, unknown>[];
    payments: { amount: number; currency: string; status: string; payment_method: string | null; failure_message: string | null; created_at: string }[];
  };

  const [{ data: profile }, { data: history }] = await Promise.all([
    order.user_id
      ? admin.from('user_profiles').select('full_name, email, phone').eq('id', order.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('order_status_history')
      .select('previous_status, new_status, reason, actor_user_id, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true }),
  ]);

  const addr = order.shipping_address ?? {};
  const customerName = tf(profile?.full_name) ?? tf(addr.full_name) ?? 'Customer';
  const customerEmail = tf(profile?.email) ?? tf(addr.email);
  const customerPhone = tf(profile?.phone) ?? tf(addr.phone);
  const initials = customerName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const TIMELINE = [
    { key: 'pending', label: 'Order placed', icon: Package },
    { key: 'processing', label: 'Processing', icon: PackageCheck },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];
  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIdx = order.status === 'cancelled' ? -1 : statusOrder.indexOf(order.status);

  const successPayment = order.payments?.find((p) => p.status === 'succeeded');

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="orders">
      {/* Back */}
      <Link href="/admin/orders" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent" />
        <div className="relative flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Order detail</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">#{order.order_number}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Placed {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {paymentBadge(order.payment_status)}
              {statusBadge(order.status)}
            </div>
          </div>
          {/* Customer avatar */}
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/60 px-5 py-4 backdrop-blur">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{customerName}</p>
              {customerEmail && <p className="truncate text-xs text-muted-foreground">{customerEmail}</p>}
            </div>
          </div>
        </div>

        {/* Status timeline bar */}
        {order.status !== 'cancelled' && (
          <div className="border-t border-border/60 bg-secondary/20 px-6 py-5 sm:px-8">
            <div className="relative flex items-start justify-between">
              <div className="absolute left-4 right-4 top-4 h-0.5 bg-border" />
              <div
                className="absolute left-4 top-4 h-0.5 bg-primary transition-all duration-700"
                style={{ width: `${Math.max(0, currentIdx / (TIMELINE.length - 1)) * 100}%` }}
              />
              {TIMELINE.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                    <span className={`flex size-8 items-center justify-center rounded-full ring-2 ring-background
                      ${done && !active ? 'bg-primary text-primary-foreground' :
                        active ? 'bg-primary text-primary-foreground ring-primary/30 ring-4' :
                        'bg-secondary text-muted-foreground'}`}>
                      {done && !active ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                    </span>
                    <span className={`hidden text-[10px] font-semibold sm:block ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {order.status === 'cancelled' && (
          <div className="flex items-center gap-2 border-t border-destructive/20 bg-destructive/[0.04] px-6 py-4 text-sm font-semibold text-destructive">
            <Clock size={15} /> This order has been cancelled
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.75fr)]">

        {/* LEFT column */}
        <div className="space-y-5">

          {/* Order items */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <Package size={17} className="text-primary" /> Order items
                <span className="ml-auto rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {order.order_items?.length ?? 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {order.order_items?.length ? (
                <div className="divide-y divide-border">
                  {order.order_items.map((item) => {
                    const attrs = item.variant_attributes && typeof item.variant_attributes === 'object' && !Array.isArray(item.variant_attributes)
                      ? Object.entries(item.variant_attributes as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')
                      : '';
                    const optLine = [item.size ? `Size ${String(item.size)}` : null, item.color, attrs].filter(Boolean).join(' · ');
                    return (
                      <article key={String(item.id)} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/50">
                          {item.product_image ? (
                            <Image src={getProductImageUrl(String(item.product_image))} alt={String(item.product_name)} fill unoptimized sizes="56px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package size={20} /></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{String(item.product_name)}</p>
                          {typeof item.product_sku === 'string' && item.product_sku && <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">SKU {item.product_sku}</p>}
                          {optLine && <p className="mt-0.5 text-xs text-muted-foreground">{optLine}</p>}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {fmt(Number(item.unit_price), order.currency)} × {Number(item.quantity)}
                          </p>
                        </div>
                        <p className="shrink-0 font-bold tabular-nums">{fmt(Number(item.total_price), order.currency)}</p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">No item snapshots saved for this order.</p>
              )}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>Product subtotal</span>
                  <span className="font-semibold text-foreground">{fmt(Number(order.subtotal_amount), order.currency)}</span>
                </div>
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>Delivery fee</span>
                  <span>{order.delivery_fee_amount == null ? 'Not configured' : fmt(Number(order.delivery_fee_amount), order.currency)}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-2 font-bold">
                  <span>{order.total_is_final ? 'Total' : 'Order amount (provisional)'}</span>
                  <span>{fmt(Number(order.total_amount), order.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment events */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={17} className="text-primary" /> Payment events
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {order.payments?.length ? (
                <div className="divide-y divide-border">
                  {order.payments.map((p, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        {p.status === 'succeeded'
                          ? <Badge variant="success">Succeeded</Badge>
                          : p.status === 'failed'
                          ? <Badge variant="destructive">Failed</Badge>
                          : <Badge variant="secondary" className="capitalize">{p.status}</Badge>}
                        <span className="text-xs text-muted-foreground capitalize">{p.payment_method || 'Card'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <span className="font-bold tabular-nums">{fmt(Number(p.amount), p.currency)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment records available.</p>
              )}
              {successPayment && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
                    Stripe test charge
                  </p>
                  <p className="mt-1 text-2xl font-black tabular-nums">
                    {fmt(Number(successPayment.amount), successPayment.currency)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Charged in {successPayment.currency.toUpperCase()} · Stripe test mode</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <Clock size={17} className="text-primary" /> Status history
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {history?.length ? (
                <ol className="relative space-y-0 border-l border-border pl-5">
                  {history.map((entry, i) => (
                    <li key={i} className="pb-5 last:pb-0">
                      <span className="absolute -left-[5px] mt-1 flex size-2.5 rounded-full bg-primary ring-2 ring-background" />
                      <p className="text-sm font-semibold capitalize">
                        {entry.previous_status} → {entry.new_status}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      {entry.reason && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.reason}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No fulfillment changes recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT column */}
        <div className="space-y-5">
          {/* Fulfillment panel */}
          <OrderFulfillmentPanel
            orderId={order.id}
            status={order.status}
            paymentStatus={order.payment_status}
            trackingNumber={order.tracking_number}
            carrier={order.carrier}
          />

          {/* Customer + Delivery */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <User size={17} className="text-primary" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{initials}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{customerName}</p>
                  {customerEmail && (
                    <a href={`mailto:${customerEmail}`} className="block truncate text-xs text-primary hover:underline">{customerEmail}</a>
                  )}
                  {customerPhone && (
                    <a href={`tel:${customerPhone}`} className="block text-xs text-muted-foreground hover:text-foreground">{customerPhone}</a>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                  <MapPin size={12} /> Delivery address
                </p>
                <address className="not-italic text-sm text-muted-foreground leading-relaxed">
                  {[
                    tf(addr.address),
                    [tf(addr.city), tf(addr.region), tf(addr.postal_code)].filter(Boolean).join(', '),
                    tf(addr.country),
                  ].filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
                  {tf(addr.delivery_instructions) && (
                    <p className="mt-2 text-xs italic">{tf(addr.delivery_instructions)}</p>
                  )}
                </address>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminWorkspace>
  );
}
