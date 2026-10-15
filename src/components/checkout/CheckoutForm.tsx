'use client';

import { FormEvent, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, CreditCard, LoaderCircle, LockKeyhole, MapPin, PackageCheck, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { placeOrder } from '@/lib/order-actions';
import { formatDisplayCurrency, formatEtb } from '@/lib/currency';
import { useCartStore } from '@/store/cartStore';
import { useDisplayCurrency } from '@/store/currencyStore';
import CurrencySwitcher from '@/components/ui/CurrencySwitcher';
import { getProductImageUrl } from '@/utils/imageUtils';

type Address = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  region: string;
  postal_code: string;
  delivery_instructions: string;
};

type Props = { initialAddress: Address; paymentCancelled: boolean };

const fields: { name: keyof Address; label: string; autoComplete: string; required?: boolean; wide?: boolean; type?: string }[] = [
  { name: 'full_name', label: 'Full name', autoComplete: 'name', required: true },
  { name: 'email', label: 'Email address', autoComplete: 'email', required: true, type: 'email' },
  { name: 'phone', label: 'Phone number', autoComplete: 'tel', required: true, type: 'tel' },
  { name: 'country', label: 'Country', autoComplete: 'country-name', required: true },
  { name: 'city', label: 'City / town', autoComplete: 'address-level2', required: true },
  { name: 'address', label: 'Street address and area', autoComplete: 'street-address', required: true, wide: true },
  { name: 'region', label: 'Region (optional)', autoComplete: 'address-level1' },
  { name: 'postal_code', label: 'Postal code (optional)', autoComplete: 'postal-code' },
  { name: 'delivery_instructions', label: 'Delivery instructions (optional)', autoComplete: 'off', wide: true },
];

const subscribeToHydration = () => () => {};
const getHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;
const idempotencyKeyStorageKey = 'ak-drop-checkout-idempotency-key';
const requestFingerprintStorageKey = 'ak-drop-checkout-request-fingerprint';

function clearStoredCheckoutRequest() {
  try {
    sessionStorage.removeItem(idempotencyKeyStorageKey);
    sessionStorage.removeItem(requestFingerprintStorageKey);
  } catch (error) {
    console.error('Unable to clear the saved checkout retry token:', error);
  }
}

export default function CheckoutForm({ initialAddress, paymentCancelled }: Props) {
  const { items, updatePrices } = useCartStore();
  const currency = useDisplayCurrency();
  const [address, setAddress] = useState(initialAddress);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    paymentCancelled ? 'Payment was not completed. Your cart is still here if you want to try again.' : '',
  );
  const [isPending, setIsPending] = useState(false);
  const hydrated = useSyncExternalStore(subscribeToHydration, getHydrationSnapshot, getServerHydrationSnapshot);
  const idempotencyKey = useRef<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    if (!items.length) {
      setErrorMessage('Your cart is empty. Add products before checking out.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage('Please confirm the Stripe test payment and delivery terms.');
      return;
    }

    setIsPending(true);
    try {
      const checkoutItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        expectedUnitPrice: Number(item.price),
      }));
      const requestFingerprint = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify({ items: checkoutItems, address, acceptedTerms })),
      );
      const fingerprint = Array.from(new Uint8Array(requestFingerprint))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      if (!idempotencyKey.current) {
        try {
          const savedFingerprint = sessionStorage.getItem(requestFingerprintStorageKey);
          const savedKey = sessionStorage.getItem(idempotencyKeyStorageKey);
          idempotencyKey.current = savedFingerprint === fingerprint && savedKey
            ? savedKey
            : crypto.randomUUID();
          sessionStorage.setItem(requestFingerprintStorageKey, fingerprint);
          sessionStorage.setItem(idempotencyKeyStorageKey, idempotencyKey.current);
        } catch (error) {
          console.error('Unable to persist the checkout retry token:', error);
          idempotencyKey.current = crypto.randomUUID();
        }
      }

      const result = await placeOrder({
        idempotencyKey: idempotencyKey.current,
        items: checkoutItems,
        address,
        acceptedTerms,
      });

      if ('error' in result) {
        if ('priceUpdates' in result && result.priceUpdates) {
          updatePrices(result.priceUpdates);
          idempotencyKey.current = null;
          clearStoredCheckoutRequest();
        }
        if ('resetIdempotency' in result && result.resetIdempotency) {
          idempotencyKey.current = null;
          clearStoredCheckoutRequest();
        }
        setErrorMessage(result.error ?? 'Please review the checkout details and try again.');
        return;
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      console.error('Checkout submission failed:', error);
      setErrorMessage('We could not place your order. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  if (!hydrated) {
    return <div className="mx-auto min-h-[60vh] max-w-6xl animate-pulse px-4 py-32"><div className="h-8 w-64 rounded bg-secondary" /><div className="mt-8 h-96 rounded-2xl bg-secondary/50" /></div>;
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-secondary/30 via-background to-background px-4 pb-16 pt-28 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_65%)]" />
      <div className="mx-auto max-w-6xl">
        <Link href="/cart" className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/30 hover:text-foreground">
          <ArrowLeft size={16} /> Back to cart
        </Link>
        <div className="mb-9 flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <LockKeyhole size={13} /> Secure checkout
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Almost yours.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Confirm where your order is going, then complete payment securely on Stripe.</p>
          </div>
          <ol aria-label="Checkout progress" className="flex w-full max-w-[25rem] items-center sm:pb-1">
            {[
              { label: 'Delivery', complete: false },
              { label: 'Payment', complete: false },
              { label: 'Confirmation', complete: false },
            ].map((step, index) => (
              <li key={step.label} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-muted-foreground'}`}>
                    {step.complete ? <Check size={14} /> : index + 1}
                  </span>
                  <span className={`hidden text-xs font-semibold sm:inline ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                </div>
                {index < 2 && <span aria-hidden="true" className="mx-3 h-px flex-1 bg-border" />}
              </li>
            ))}
          </ol>
        </div>

        {!items.length ? (
          <section className="rounded-2xl border border-border bg-card p-8 text-center">
            <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={34} />
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add something you love before placing an order.</p>
            <Link className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground" href="/shop">Browse products</Link>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm shadow-black/[0.025] backdrop-blur sm:p-7">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary"><MapPin size={19} /></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Step 1 · Delivery</p><h2 className="mt-1 text-xl font-bold">Where should we deliver?</h2></div>
                  </div>
                  <p className="pl-1 text-xs text-muted-foreground sm:pl-0">Your details stay with this order.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label key={field.name} className={`space-y-2 ${field.wide ? 'sm:col-span-2' : ''}`}>
                      <span className="text-sm font-semibold">{field.label}{field.required && <span className="text-primary"> *</span>}</span>
                      {field.name === 'delivery_instructions' ? (
                        <textarea
                          autoComplete={field.autoComplete}
                          maxLength={500}
                          rows={3}
                          value={address[field.name]}
                          onChange={(event) => setAddress({ ...address, [field.name]: event.target.value })}
                          className="w-full resize-y rounded-xl border border-input bg-background/80 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                      ) : (
                        <input
                          autoComplete={field.autoComplete}
                          type={field.type || 'text'}
                          required={field.required}
                          maxLength={field.name === 'address' ? 300 : 254}
                          value={address[field.name]}
                          onChange={(event) => setAddress({ ...address, [field.name]: event.target.value })}
                          className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm shadow-black/[0.025] backdrop-blur sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400"><CreditCard size={19} /></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Step 2 · Payment</p><h2 className="mt-1 text-xl font-bold">Pay securely with Stripe</h2></div>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
                    <ShieldCheck size={14} className="text-emerald-500" /> Protected
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-secondary/60 to-background p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-md">
                      <p className="text-sm font-bold">Card payment · hosted by Stripe</p>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Your card number and billing address are entered on Stripe&apos;s secure page—not stored by AK Drop.</p>
                    </div>
                    <div className="flex items-center gap-1.5" aria-label="Card payments accepted through Stripe">
                      <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-black tracking-wide text-foreground/70">VISA</span>
                      <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-black tracking-wide text-foreground/70">Mastercard</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><LockKeyhole size={12} className="text-emerald-500" />Encrypted payment</span>
                    <span className="inline-flex items-center gap-1.5"><PackageCheck size={12} />Billing address collected by Stripe</span>
                  </div>
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm leading-relaxed text-muted-foreground transition hover:text-foreground">
                  <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 size-4 shrink-0 accent-primary" />
                  <span>I understand this is a Stripe test-mode payment in USD, and delivery costs and fulfillment are not included.</span>
                </label>
              </section>

              {errorMessage && <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMessage}</p>}
            </div>

            <aside className="h-fit overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg shadow-black/[0.04] lg:sticky lg:top-28">
              <div className="border-b border-border bg-gradient-to-br from-secondary/50 to-transparent p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Your bag</p>
                    <h2 className="mt-1 text-lg font-bold">Order summary</h2>
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                </div>
                <div className="mt-4"><CurrencySwitcher /></div>
              </div>
              <div className="max-h-72 space-y-4 overflow-auto p-5 sm:p-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/50">
                      <Image src={getProductImageUrl(item.main_image)} alt={item.name} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Qty {item.quantity} · {formatDisplayCurrency(Number(item.price), currency)} each</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold">{formatDisplayCurrency(Number(item.price) * item.quantity, currency)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-border px-5 py-5 text-sm sm:px-6">
                <div className="flex justify-between"><span className="text-muted-foreground">Product subtotal</span><span className="font-semibold">{formatDisplayCurrency(subtotal, currency)}</span></div>
                <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Truck size={14} /> Delivery</span><span className="text-xs font-medium text-muted-foreground">Not configured</span></div>
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Due on Stripe</p>
                      <p className="mt-1 text-xl font-black tracking-tight">{formatDisplayCurrency(subtotal, 'USD')}</p>
                    </div>
                    <span className="pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Test charge</span>
                  </div>
                  <p className="mt-2 border-t border-primary/10 pt-2 text-[11px] leading-5 text-muted-foreground">Order value: {formatEtb(subtotal)} · illustrative conversion to USD. Delivery not included.</p>
                </div>
              </div>
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <button type="submit" disabled={isPending || !items.length} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                  {isPending ? <LoaderCircle size={18} className="animate-spin" /> : <LockKeyhole size={17} />}
                  {isPending ? 'Opening secure checkout…' : 'Continue to payment'}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"><ShieldCheck size={13} className="text-emerald-500" />Secure checkout powered by Stripe</p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
