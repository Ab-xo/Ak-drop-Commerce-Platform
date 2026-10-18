import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Package } from 'lucide-react';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import OrderFulfillmentPanel from '@/components/admin/OrderFulfillmentPanel';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

function textField(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function formatAmount(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${value.toLocaleString('en-US')}`;
  }
}

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, adminUser] = await Promise.all([params, getServerVerifiedAdmin()]);
  if (!adminUser || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from('orders')
    .select('id, order_number, user_id, status, payment_status, payment_method, total_amount, subtotal_amount, delivery_fee_amount, total_is_final, currency, shipping_address, created_at, order_items(id, product_name, product_sku, product_image, quantity, unit_price, total_price, size, color), payments(amount, currency, status, payment_method, failure_message, created_at)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Admin order detail load failed:', error.message);
    throw new Error('Unable to load this order.');
  }
  if (!order) notFound();

  const [{ data: profile, error: profileError }, { data: history, error: historyError }] = await Promise.all([
    order.user_id
      ? admin.from('user_profiles').select('full_name, email, phone').eq('id', order.user_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.from('order_status_history')
      .select('previous_status, new_status, reason, actor_user_id, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false }),
  ]);
  if (profileError) {
    console.error('Admin order customer details failed:', profileError.message);
    throw new Error('Unable to load the order customer details.');
  }
  if (historyError) {
    console.error('Admin order history load failed:', historyError.message);
    throw new Error('Unable to load the order status history. Apply the latest database/setup.sql if the audit table is missing.');
  }

  const address = order.shipping_address && typeof order.shipping_address === 'object'
    ? order.shipping_address as Record<string, unknown>
    : {};
  const customerName = textField(profile?.full_name) || textField(address.full_name) || 'Customer';
  const customerEmail = textField(profile?.email) || textField(address.email);
  const customerPhone = textField(profile?.phone) || textField(address.phone);
  const addressLines = [
    textField(address.address),
    [textField(address.city), textField(address.region), textField(address.postal_code)].filter(Boolean).join(', '),
    textField(address.country),
  ].filter(Boolean);

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="orders">
      <Link href="/admin/orders" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft size={16} /> Back to orders
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Order detail</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">#{order.order_number}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placed {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <span className="rounded-full bg-secondary px-3 py-1.5 capitalize">{order.payment_status} payment</span>
          <span className="rounded-full bg-primary/10 px-3 py-1.5 capitalize text-primary">{order.status}</span>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.8fr)]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Package size={17} className="text-primary" />
              <h2 className="font-bold">Order items</h2>
            </header>
            {order.order_items?.length ? (
              <div className="divide-y divide-border">
                {order.order_items.map((item) => (
                  <article key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.product_sku ? `SKU ${item.product_sku} · ` : ''}Qty {item.quantity}
                        {item.size ? ` · Size ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums">
                      {formatAmount(Number(item.total_price), order.currency)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-muted-foreground">No item snapshots were saved for this order.</p>
            )}
            <div className="space-y-2 border-t border-border bg-secondary/20 px-5 py-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Product subtotal</span><span className="font-semibold">{formatAmount(Number(order.subtotal_amount), order.currency)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Delivery</span><span className="text-right">{order.delivery_fee_amount == null ? 'Not configured' : formatAmount(Number(order.delivery_fee_amount), order.currency)}</span></div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 font-bold"><span>{order.total_is_final ? 'Total' : 'Current order amount'}</span><span>{formatAmount(Number(order.total_amount), order.currency)}</span></div>
              {!order.total_is_final && <p className="text-right text-[11px] text-muted-foreground">Final amount excludes delivery; shipping is not configured.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin size={17} className="text-primary" />
              <h2 className="font-bold">Customer and delivery</h2>
            </div>
            <p className="mt-4 font-semibold">{customerName}</p>
            {customerEmail && <a className="mt-1 block text-sm text-primary hover:underline" href={`mailto:${customerEmail}`}>{customerEmail}</a>}
            {customerPhone && <a className="mt-1 block text-sm text-muted-foreground hover:text-foreground" href={`tel:${customerPhone}`}>{customerPhone}</a>}
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              {addressLines.length ? addressLines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>) : <p>Delivery address unavailable.</p>}
              {textField(address.delivery_instructions) && <p className="pt-2"><span className="font-semibold text-foreground">Instructions: </span>{textField(address.delivery_instructions)}</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-bold">Payment events</h2>
            {order.payments?.length ? (
              <div className="mt-3 divide-y divide-border">
                {order.payments.map((payment, index) => (
                  <div key={`${payment.created_at}-${index}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <div><span className="font-semibold capitalize">{payment.status}</span><span className="ml-2 text-xs text-muted-foreground">{payment.payment_method || order.payment_method || 'Payment provider'}</span></div>
                    <span className="font-semibold tabular-nums">{formatAmount(Number(payment.amount), payment.currency)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">No payment records are available.</p>}
          </section>
        </div>

        <div className="space-y-5">
          <OrderFulfillmentPanel orderId={order.id} status={order.status} paymentStatus={order.payment_status} />
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-bold">Status history</h2>
            {history?.length ? (
              <ol className="mt-4 space-y-4">
                {history.map((entry, index) => (
                  <li key={`${entry.created_at}-${index}`} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-sm font-semibold capitalize">{entry.previous_status} → {entry.new_status}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(entry.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    {entry.actor_user_id && <p className="mt-1 break-all text-[10px] text-muted-foreground">Staff ID: {entry.actor_user_id}</p>}
                    {entry.reason && <p className="mt-2 text-xs leading-5 text-muted-foreground">{entry.reason}</p>}
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-muted-foreground">No staff fulfillment changes have been recorded.</p>}
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}
