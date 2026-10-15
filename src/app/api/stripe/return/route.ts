import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { getSiteUrl, getStripeClient } from '@/lib/stripe';

function redirectToCheckout(siteUrl: string, reason: string) {
  const target = new URL('/checkout', siteUrl);
  target.searchParams.set('cancelled', '1');
  target.searchParams.set('reason', reason);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  let siteUrl: string;
  let verifiedOrderId: string | undefined;
  try {
    siteUrl = getSiteUrl();
  } catch (error) {
    console.error('Stripe return URL configuration error:', error);
    return NextResponse.json({ error: 'Checkout return is not configured.' }, { status: 503 });
  }

  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId) return redirectToCheckout(siteUrl, 'missing-session');

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (
      session.payment_status !== 'paid' ||
      session.mode !== 'payment' ||
      !orderId ||
      !userId ||
      session.currency !== 'usd' ||
      session.amount_total === null
    ) {
      return redirectToCheckout(siteUrl, 'payment-not-confirmed');
    }
    if (
      userId !== session.client_reference_id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
    ) {
      console.error('Stripe return contained invalid order metadata.');
      return redirectToCheckout(siteUrl, 'invalid-session');
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError && userError.message !== 'Auth session missing!') {
      console.error('Stripe return authentication check failed:', userError.message);
      return redirectToCheckout(siteUrl, 'authentication-failed');
    }
    if (user?.id !== userId) {
      const signInUrl = new URL('/auth/signin', siteUrl);
      signInUrl.searchParams.set(
        'redirect',
        `/orders/${encodeURIComponent(orderId)}?payment=success`,
      );
      return NextResponse.redirect(signInUrl);
    }

    verifiedOrderId = orderId;
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
    const billingAddress = session.customer_details
      ? {
          name: session.customer_details.name,
          email: session.customer_details.email,
          phone: session.customer_details.phone,
          address: session.customer_details.address,
        }
      : null;

    const admin = createAdminClient();
    const { error } = await admin.rpc('resolve_stripe_checkout', {
      p_checkout_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
      p_outcome: 'paid',
      p_billing_address: billingAddress,
      p_amount_total: session.amount_total,
      p_currency: session.currency,
      p_metadata_order_id: orderId,
      p_metadata_user_id: userId,
      p_client_reference_id: session.client_reference_id,
    });
    if (error) {
      console.error('Stripe return could not confirm payment in Supabase:', error.message);
      return NextResponse.redirect(
        new URL(`/orders/${encodeURIComponent(orderId)}?payment=success`, siteUrl),
      );
    }

    return NextResponse.redirect(
      new URL(`/orders/${encodeURIComponent(orderId)}?payment=success`, siteUrl),
    );
  } catch (error) {
    console.error('Stripe Checkout return verification failed:', error);
    if (verifiedOrderId) {
      return NextResponse.redirect(
        new URL(`/orders/${encodeURIComponent(verifiedOrderId)}?payment=success`, siteUrl),
      );
    }
    return redirectToCheckout(siteUrl, 'verification-failed');
  }
}
