import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Check, CheckCircle2, Clock3, MapPin, Package, ShieldCheck, Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { formatDisplayCurrency } from '@/lib/currency';
import { getProductImageUrl } from '@/utils/imageUtils';
import ClearCartOnPaidOrder from '@/components/checkout/ClearCartOnPaidOrder';

type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  product_image: string | null;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
};

type OrderDetails = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal_amount: number;
  delivery_fee_amount: number | null;
  total_is_final: boolean;
  currency: string;
  shipping_address: Record<string, unknown> | null;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
  payments: { amount: number; currency: string; status: string }[];
};

function addressField(address: Record<string, unknown> | null, name: string) {
  const value = address?.[name];
  return typeof value === 'string' ? value : '';
}

function formatPaymentAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError && userError.message !== 'Auth session missing!') {
    console.error('Order detail authentication error:', userError.message);
    throw new Error('Unable to verify your sign-in.');
  }
  if (!user) redirect(`/auth/signin?redirect=/orders/${encodeURIComponent(id)}`);

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, subtotal_amount, delivery_fee_amount, total_is_final, currency, shipping_address, payment_method, payment_status, created_at, order_items(id, product_id, product_name, product_slug, product_image, product_sku, quantity, unit_price, total_price, size, color), payments(amount, currency, status)')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Order detail lookup error:', error.message);
    throw new Error('Unable to load this order.');
  }
  if (!data) notFound();

  const order = data as OrderDetails;
  const shipping = order.shipping_address;
  const orderStages = ['pending', 'processing', 'shipped', 'delivered'];
  const currentStage = orderStages.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const paymentComplete = order.payment_status === 'paid';
  const paymentReturned = query.payment === 'success';
  const successfulPayment = order.payments?.find((payment) => payment.status === 'succeeded');
  const formattedDate = new Date(order.created_at).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-28">
      {paymentReturned && <ClearCartOnPaidOrder />}
      <div className="mx-auto max-w-5xl">
        <Link href="/account?tab=orders" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft size={16} /> My orders
        </Link>

        <section className="relative mb-7 overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-black/[0.04]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.09] via-transparent to-emerald-500/[0.06]" />
          <div className="absolute -right-20 -top-28 size-80 rounded-full bg-primary/[0.08] blur-3xl" />
          <div className="relative p-6 sm:p-10">
            <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-start">
              <div className="flex items-start gap-4">
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ring-1 ${paymentComplete ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/15' : 'bg-amber-500/10 text-amber-600 ring-amber-500/15'}`}>
                  <CheckCircle2 size={29} />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.22em] ${paymentComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isCancelled ? 'Checkout cancelled' : paymentComplete ? 'Stripe test payment confirmed' : paymentReturned ? 'Stripe payment received · confirming order' : 'Payment pending'}
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{paymentComplete ? 'Your order is confirmed.' : isCancelled ? 'This checkout was cancelled.' : paymentReturned ? 'We’re confirming your payment.' : 'Your order is awaiting payment.'}</h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {paymentComplete
                      ? 'Your Stripe test-mode card payment was confirmed. Shipping charges are not included and fulfillment is not connected.'
                      : isCancelled
                        ? 'This order was cancelled after its Stripe Checkout session expired. Add the items to your cart again to start a new checkout.'
                        : paymentReturned
                          ? 'Stripe confirmed your test payment. We are updating your order record; refresh this page shortly to see the confirmed status.'
                        : 'Complete payment through Stripe to confirm this order. Your card payment will be processed in test mode.'}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/75 px-5 py-4 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Order number</p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wide">#{order.order_number}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </div>

            <div className="mt-9 rounded-2xl border border-border/80 bg-background/70 p-5 sm:p-6">
              {isCancelled ? (
                <div className="flex items-center gap-3 text-sm font-semibold text-destructive">
                  <Clock3 size={18} />This order has been cancelled.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {orderStages.map((stage, index) => {
                    const complete = index <= currentStage;
                    const StageIcon = index === 0 ? Check : index === 1 ? Package : Truck;
                    return (
                      <div key={stage} className="relative">
                        {index > 0 && <div className={`absolute -left-1/2 top-4 h-0.5 w-full ${index <= currentStage ? 'bg-primary' : 'bg-border'}`} />}
                        <div className="relative flex flex-col items-center text-center">
                          <span className={`flex size-8 items-center justify-center rounded-full ring-4 ring-background ${complete ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                            <StageIcon size={15} />
                          </span>
                          <span className={`mt-2 text-[10px] font-bold capitalize sm:text-xs ${complete ? 'text-foreground' : 'text-muted-foreground'}`}>{stage}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <Clock3 size={14} />
                Current status: <span className="font-bold capitalize text-foreground">{order.status}</span>
                <span className="mx-1 text-border">•</span>
                <Truck size={14} />
                Payment: <span className="font-bold capitalize text-foreground">{order.payment_method === 'stripe' ? `Stripe · ${order.payment_status}` : order.payment_status}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
            <header className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your selection</p>
                <h2 className="mt-1 text-xl font-black">Order items</h2>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">{order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}</span>
            </header>
            <div className="divide-y divide-border px-5 sm:px-7">
              {order.order_items.map((item) => (
                <article key={item.id} className="flex gap-4 py-5 sm:gap-5">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/50 sm:size-28">
                    {item.product_image ? (
                      <Image
                        src={getProductImageUrl(item.product_image)}
                        alt={item.product_name}
                        fill
                        unoptimized
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/50"><Package size={28} /></div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      {item.product_id ? (
                        <Link href={`/shop/${item.product_id}`} className="line-clamp-2 font-bold leading-snug transition hover:text-primary">{item.product_name}</Link>
                      ) : (
                        <h3 className="line-clamp-2 font-bold leading-snug">{item.product_name}</h3>
                      )}
                      {item.product_sku && <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">SKU {item.product_sku}</p>}
                      {(item.size || item.color) && <p className="mt-2 text-xs text-muted-foreground">{[item.size && `Size ${item.size}`, item.color && `Color ${item.color}`].filter(Boolean).join(' · ')}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">{formatDisplayCurrency(Number(item.unit_price), 'USD')} <span className="mx-1">×</span> {item.quantity}</p>
                    </div>
                    <p className="shrink-0 font-bold sm:text-right">{formatDisplayCurrency(Number(item.total_price), 'USD')}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-secondary/20 px-5 py-4 text-sm sm:px-7">
              <span className="text-muted-foreground">Product subtotal</span>
              <span className="font-bold">{formatDisplayCurrency(Number(order.subtotal_amount), 'USD')}</span>
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-black">Payment summary</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Items subtotal</span><span className="font-semibold">{formatDisplayCurrency(Number(order.subtotal_amount), 'USD')}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Delivery fee</span><span className="text-right">{order.delivery_fee_amount == null ? 'Not included' : formatDisplayCurrency(Number(order.delivery_fee_amount), 'USD')}</span></div>
                {successfulPayment && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                          Paid with Stripe
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Test-mode card payment</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Paid
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-black tracking-tight">
                      {formatPaymentAmount(successfulPayment.amount, successfulPayment.currency)}
                    </p>
                    <p className="mt-2 border-t border-emerald-500/15 pt-2 text-[11px] leading-relaxed text-muted-foreground">
                      Charged in {successfulPayment.currency.toUpperCase()}. The order value is stored in the database&apos;s original currency and displayed here in USD.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-primary/[0.07] p-4 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-primary" />
                <p>Order prices are displayed in USD using the project&apos;s fixed illustrative conversion rate, and the Stripe test charge is shown in USD. This is not a live foreign-exchange quote. Delivery is not included and fulfillment is not connected.</p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-black"><MapPin size={18} className="text-primary" />Delivery address</h2>
              <address className="mt-4 space-y-1.5 text-sm not-italic text-muted-foreground">
                <p className="font-semibold text-foreground">{addressField(shipping, 'full_name')}</p>
                <p>{addressField(shipping, 'phone')}</p>
                <p>{addressField(shipping, 'address')}</p>
                <p>{[addressField(shipping, 'city'), addressField(shipping, 'region'), addressField(shipping, 'postal_code'), addressField(shipping, 'country')].filter(Boolean).join(', ')}</p>
                {addressField(shipping, 'delivery_instructions') && <p className="mt-3 border-t border-border pt-3">{addressField(shipping, 'delivery_instructions')}</p>}
              </address>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
