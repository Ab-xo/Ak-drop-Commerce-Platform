'use server';

import { z } from 'zod';
import type Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getStripeClient, getSiteUrl } from '@/lib/stripe';
import { ETB_PER_DISPLAY_UNIT } from '@/lib/currency';

const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
    quantity: z.number().int().min(1).max(999),
    expectedUnitPrice: z.number().finite().nonnegative(),
  })).min(1).max(30),
  address: z.object({
    full_name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,30}$/),
    country: z.string().trim().min(2).max(80),
    address: z.string().trim().min(5).max(300),
    city: z.string().trim().min(2).max(80),
    region: z.string().trim().max(80),
    postal_code: z.string().trim().max(20),
    delivery_instructions: z.string().trim().max(500),
  }),
  acceptedTerms: z.literal(true),
});

type PriceUpdate = { productId: string; variantId: string | null; price: number };

export async function placeOrder(input: unknown) {
  const validated = checkoutSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Please check your delivery details.' };
  }

  let stripe: ReturnType<typeof getStripeClient>;
  let siteUrl: string;
  let admin: ReturnType<typeof createAdminClient>;
  try {
    stripe = getStripeClient();
    siteUrl = getSiteUrl();
    admin = createAdminClient();
    if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
      throw new Error('Set STRIPE_WEBHOOK_SECRET to verify Stripe payment events before enabling checkout.');
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Secure payment is not configured.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError && userError.message !== 'Auth session missing!') {
    console.error('Checkout authentication error:', userError.message);
    return { error: 'Unable to verify your sign-in. Please try again.' };
  }
  if (!user) return { error: 'Sign in to place an order.' };

  const { error: paymentSchemaError } = await admin
    .from('payments')
    .select('stripe_checkout_session_id')
    .limit(0);
  if (paymentSchemaError) {
    console.error('Stripe payment schema is unavailable:', paymentSchemaError.message);
    return {
      error: 'Stripe checkout is not enabled in the database yet. Apply the latest database/setup.sql in Supabase, then retry.',
    };
  }

  const { data, error } = await supabase.rpc('create_customer_order', {
    p_idempotency_key: validated.data.idempotencyKey,
    p_items: validated.data.items.map((item) => ({
      product_id: item.productId,
      ...(item.variantId ? { variant_id: item.variantId } : {}),
      quantity: item.quantity,
      expected_unit_price: item.expectedUnitPrice,
    })),
    p_shipping_address: validated.data.address,
  });

  if (error) {
    if (error.code === 'PGRST202' || error.message.includes('Could not find the function public.create_customer_order')) {
      console.error('Order creation RPC is missing from the Supabase schema cache. Apply database/setup.sql to the connected Supabase project.');
      return {
        error: 'Order placement is not enabled in the connected database yet. Apply the latest database/setup.sql in Supabase SQL Editor, then retry.',
      };
    }
    if (error.message.includes('ORDER_PRICE_CHANGED')) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, price, product_variants(id, price_adjustment, price_override, is_active)')
        .in('id', validated.data.items.map((item) => item.productId))
        .eq('is_active', true);

      if (productsError) {
        console.error('Checkout price refresh error:', productsError.message);
        return { error: 'A product price changed. Return to your cart and try again.' };
      }
      const priceUpdates: PriceUpdate[] = validated.data.items.flatMap((item) => {
        const product = products?.find((candidate) => candidate.id === item.productId);
        if (!product) return [];
        const variant = item.variantId
          ? product.product_variants?.find((candidate) => candidate.id === item.variantId && candidate.is_active)
          : null;
        if (item.variantId && !variant) return [];
        return [{
          productId: item.productId,
          variantId: item.variantId,
          price: variant
            ? Number(variant.price_override ?? Number(product.price) + Number(variant.price_adjustment ?? 0))
            : Number(product.price),
        }];
      });
      return { error: 'A product price changed. Review the updated cart total and place your order again.', priceUpdates };
    }
    if (error.message.includes('ORDER_STOCK_CHANGED')) {
      return { error: 'One or more items no longer have enough stock. Update your cart and try again.' };
    }
    if (error.message.includes('ORDER_VARIANT_REQUIRED')) {
      return { error: 'Choose an available size or option for each configurable product.' };
    }
    if (error.message.includes('ORDER_VARIANT_UNAVAILABLE')) {
      return { error: 'One or more selected options are no longer available. Refresh your cart and try again.' };
    }
    if (error.message.includes('ORDER_PRODUCT_UNAVAILABLE')) {
      return { error: 'One or more products are no longer available. Remove them from your cart and try again.' };
    }
    if (error.message.includes('ORDER_INVALID_ADDRESS') || error.message.includes('ORDER_INVALID_ITEMS')) {
      return { error: 'Please check your delivery details and cart items.' };
    }
    if (error.message.includes('ORDER_TOTAL_LIMIT')) {
      return { error: 'The order total is above the checkout limit. Please contact AK Drop for assistance.' };
    }
    if (error.message.includes('ORDER_IDEMPOTENCY_CONFLICT')) {
      return {
        error: 'Your checkout details changed. Submit again to start a new payment session.',
        resetIdempotency: true as const,
      };
    }
    if (error.message.includes('ORDER_AUTH_REQUIRED')) {
      return { error: 'Your sign-in has expired. Sign in again to place your order.' };
    }
    console.error('Order creation error:', error.message);
    return { error: 'We could not place your order. Please try again.' };
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('id' in data) ||
    !('order_number' in data) ||
    !('subtotal_amount' in data)
  ) {
    console.error('Order creation returned an invalid response.');
    return { error: 'We could not confirm your order. Check your order history before retrying.' };
  }

  const orderId = String(data.id);
  const orderNumber = String(data.order_number);
  const orderStatus = 'status' in data ? String(data.status) : 'pending';
  const paymentStatus = 'payment_status' in data ? String(data.payment_status) : 'pending';
  if (orderStatus === 'cancelled') {
    return {
      error: 'This order is no longer active. Refresh checkout to start a new order.',
      resetIdempotency: true as const,
    };
  }
  if (paymentStatus === 'paid') {
    return {
      success: true as const,
      orderId,
      orderNumber,
      checkoutUrl: `${siteUrl}/orders/${encodeURIComponent(orderId)}?payment=success`,
    };
  }
  const subtotalEtb = Number(data.subtotal_amount);
  const amountUsdCents = Math.round((subtotalEtb / ETB_PER_DISPLAY_UNIT.USD) * 100);
  if (!Number.isFinite(subtotalEtb) || amountUsdCents < 50) {
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to cancel an order below Stripe minimum:', cancelError.message);
    return {
      error: 'The order total is below Stripe’s minimum for a card payment.',
      resetIdempotency: true as const,
    };
  }

  const { data: pendingPayment, error: pendingPaymentError } = await admin
    .from('payments')
    .select('stripe_checkout_session_id')
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .not('stripe_checkout_session_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingPaymentError) {
    console.error('Unable to check for an existing Stripe session:', pendingPaymentError.message);
    return { error: 'We could not start secure payment. Please try again.' };
  }

  if (pendingPayment?.stripe_checkout_session_id) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        pendingPayment.stripe_checkout_session_id,
      );
      if (existingSession.status === 'open' && existingSession.url) {
        return {
          success: true as const,
          orderId,
          orderNumber,
          checkoutUrl: existingSession.url,
        };
      }
      if (existingSession.status === 'complete' && existingSession.payment_status === 'paid') {
        if (
          existingSession.mode !== 'payment' ||
          existingSession.metadata?.orderId !== orderId ||
          existingSession.metadata?.userId !== user.id ||
          existingSession.client_reference_id !== user.id ||
          existingSession.currency !== 'usd' ||
          existingSession.amount_total === null
        ) {
          console.error('Existing Stripe Checkout session does not match the current order.');
          return { error: 'We could not verify the completed payment. Contact support before trying again.' };
        }
        const paymentIntentId = typeof existingSession.payment_intent === 'string'
          ? existingSession.payment_intent
          : existingSession.payment_intent?.id ?? null;
        const billingAddress = existingSession.customer_details
          ? {
              name: existingSession.customer_details.name,
              email: existingSession.customer_details.email,
              phone: existingSession.customer_details.phone,
              address: existingSession.customer_details.address,
            }
          : null;
        const { error: resolveError } = await admin.rpc('resolve_stripe_checkout', {
          p_checkout_session_id: existingSession.id,
          p_payment_intent_id: paymentIntentId,
          p_outcome: 'paid',
          p_billing_address: billingAddress,
          p_amount_total: existingSession.amount_total,
          p_currency: existingSession.currency,
          p_metadata_order_id: existingSession.metadata.orderId,
          p_metadata_user_id: existingSession.metadata.userId,
          p_client_reference_id: existingSession.client_reference_id,
        });
        if (resolveError) {
          console.error('Unable to confirm the existing Stripe payment:', resolveError.message);
          return { error: 'Payment may already be complete. Check your order history before trying again.' };
        }
        return {
          success: true as const,
          orderId,
          orderNumber,
          checkoutUrl: `${siteUrl}/orders/${encodeURIComponent(orderId)}?payment=success`,
        };
      }
      if (existingSession.status === 'complete') {
        return { error: 'This payment session is complete but not marked paid. Please contact support before retrying.' };
      }
    } catch (error) {
      console.error('Unable to retrieve the existing Stripe Checkout session:', error);
      return { error: 'We could not verify your existing payment session. Please try again.' };
    }
  }

  const { count: paymentAttemptCount, error: paymentCountError } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId);
  if (paymentCountError) {
    console.error('Unable to determine the Stripe payment attempt number:', paymentCountError.message);
    return { error: 'We could not start secure payment. Please try again.' };
  }

  // `variant_attributes` was added to order_items via ALTER TABLE (see database/setup.sql line ~401).
  // If that migration hasn't run on the live DB, the SELECT will fail with a 42703 column-not-found
  // error even though the order itself was created fine. Fall back to selecting without it.
  type OrderItemRow = {
    product_name: string;
    product_sku: string | null;
    quantity: number;
    unit_price: number;
    size: string | null;
    color: string | null;
    variant_attributes?: Record<string, unknown> | null;
  };

  const fullSelect = 'product_name, product_sku, quantity, unit_price, size, color, variant_attributes';
  const fallbackSelect = 'product_name, product_sku, quantity, unit_price, size, color';

  let rawOrderItems = await admin
    .from('order_items')
    .select(fullSelect)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (
    rawOrderItems.error &&
    (rawOrderItems.error.code === '42703' ||
      rawOrderItems.error.code === 'PGRST204' ||
      rawOrderItems.error.message?.includes('variant_attributes'))
  ) {
    console.warn(
      'order_items.variant_attributes column missing — retrying without it. ' +
        'Apply the ALTER TABLE migration in database/setup.sql to fix this permanently.',
    );
    rawOrderItems = await admin
      .from('order_items')
      .select(fallbackSelect)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }) as typeof rawOrderItems;
  }

  const orderItems = rawOrderItems.data as OrderItemRow[] | null;
  const orderItemsError = rawOrderItems.error;

  if (orderItemsError || !orderItems?.length) {
    console.error('Unable to load the verified order item snapshots for Stripe Checkout:', orderItemsError?.message ?? 'Order items are missing.');
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to release inventory after product lookup failed:', cancelError.message);
    return {
      error: 'We could not load the verified order details for payment. Please retry checkout.',
      resetIdempotency: true as const,
    };
  }

  const stripeLineItems = orderItems.map((item) => {
    const unitPriceEtb = Math.round(Number(item.unit_price) * 100);
    const rawAttrs = item.variant_attributes;
    const attributes = rawAttrs && typeof rawAttrs === 'object' && !Array.isArray(rawAttrs)
      ? Object.entries(rawAttrs)
          .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
          .map(([name, value]) => `${name}: ${value}`)
      : [];
    const optionDescription = [item.size ? `Size ${item.size}` : null, item.color, ...attributes]
      .filter((value): value is string => Boolean(value))
      .join(' · ');
    return {
      name: item.product_name,
      sku: item.product_sku,
      quantity: Number(item.quantity),
      unitPriceEtb,
      optionDescription,
      exactUsdCents: (unitPriceEtb * Number(item.quantity)) / ETB_PER_DISPLAY_UNIT.USD,
    };
  });

  if (stripeLineItems.some((item) => !Number.isSafeInteger(item.unitPriceEtb) || !Number.isFinite(item.exactUsdCents))) {
    console.error('Verified Stripe Checkout order snapshots contain an invalid price.');
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to release inventory after product price validation failed:', cancelError.message);
    return {
      error: 'We could not verify the product prices for payment. Please retry checkout.',
      resetIdempotency: true as const,
    };
  }

  const pricedLineItems = stripeLineItems.filter((item) => item !== null);
  const orderSubtotalEtbMinor = Math.round(subtotalEtb * 100);
  const productsSubtotalEtbMinor = pricedLineItems.reduce(
    (sum, item) => sum + item.unitPriceEtb * item.quantity,
    0,
  );

  if (productsSubtotalEtbMinor !== orderSubtotalEtbMinor) {
    console.error('Verified Stripe Checkout product total does not match the reserved order subtotal.');
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to release inventory after order total mismatch:', cancelError.message);
    return {
      error: 'The order total changed while checkout was starting. Please refresh your cart and try again.',
      resetIdempotency: true as const,
    };
  }

  const stripeAmountsCents = pricedLineItems.map((item) => Math.floor(item.exactUsdCents));
  let roundingCents = amountUsdCents - stripeAmountsCents.reduce((sum, amount) => sum + amount, 0);
  const roundingOrder = pricedLineItems
    .map((item, index) => ({ index, remainder: item.exactUsdCents - stripeAmountsCents[index] }))
    .sort((left, right) => right.remainder - left.remainder);

  for (let index = 0; roundingCents > 0; index += 1, roundingCents -= 1) {
    const target = roundingOrder[index % roundingOrder.length];
    stripeAmountsCents[target.index] += 1;
  }

  if (
    stripeAmountsCents.some((amount) => amount < 1) ||
    stripeAmountsCents.reduce((sum, amount) => sum + amount, 0) !== amountUsdCents
  ) {
    console.error('Unable to allocate the Stripe currency rounding across order items.');
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to release inventory after Stripe amount allocation failed:', cancelError.message);
    return {
      error: 'We could not calculate the payment total safely. Please retry checkout.',
      resetIdempotency: true as const,
    };
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      allowed_payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_email: validated.data.address.email,
      client_reference_id: user.id,
      line_items: pricedLineItems.map((item, index) => ({
        price_data: {
          currency: 'usd',
          unit_amount: stripeAmountsCents[index],
          product_data: {
            name: item.name + (item.optionDescription ? ` · ${item.optionDescription}` : ''),
            description: item.sku ? `SKU: ${item.sku} · Qty ${item.quantity}` : `Qty ${item.quantity}`,
          },
        },
        quantity: 1,
      })),
      submit_type: 'pay',
      custom_text: {
        submit: {
          message: 'AK Drop · Test mode. Use card 4242 4242 4242 4242, any future date, any CVC.',
        },
      },
      metadata: { orderId, userId: user.id },
      payment_intent_data: { metadata: { orderId, userId: user.id } },
      success_url: `${siteUrl}/api/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=1`,
    }, {
      idempotencyKey: `akdrop-checkout-${orderId}-${(paymentAttemptCount ?? 0) + 1}`,
    });
  } catch (error) {
    console.error('Stripe Checkout session creation failed:', error);
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to release inventory after Stripe setup failed:', cancelError.message);
    return {
      error: 'Stripe could not start the payment session. Your pending order was cancelled; please retry.',
      resetIdempotency: true as const,
    };
  }

  if (!session.url) {
    console.error('Stripe Checkout returned a session without a redirect URL.');
    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (error) {
      console.error('Unable to expire a Stripe session without a redirect URL:', error);
    }
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to release inventory after Stripe returned no URL:', cancelError.message);
    return { error: 'Stripe did not return a payment link. Please retry checkout.', resetIdempotency: true as const };
  }

  const { error: paymentInsertError } = await admin.from('payments').insert({
    order_id: orderId,
    user_id: user.id,
    stripe_checkout_session_id: session.id,
    amount: amountUsdCents / 100,
    currency: 'USD',
    status: 'pending',
    payment_method: 'card',
    metadata: { order_number: orderNumber },
  });

  if (paymentInsertError) {
    if (paymentInsertError.code === '23505') {
      const { data: existingPayment, error: existingPaymentError } = await admin
        .from('payments')
        .select('id')
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle();
      if (existingPaymentError) {
        console.error('Unable to verify a duplicate Stripe payment record:', existingPaymentError.message);
        return { error: 'We could not confirm the payment session was saved. Please check your orders before retrying.' };
      }
      if (existingPayment) {
        return {
          success: true as const,
          orderId,
          orderNumber,
          checkoutUrl: session.url,
        };
      }
    }
    console.error('Unable to save the Stripe Checkout session:', paymentInsertError.message);
    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (error) {
      console.error('Unable to expire Stripe session after payment record failure:', error);
    }
    const { error: cancelError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: orderId,
    });
    if (cancelError) console.error('Unable to release inventory after payment record failure:', cancelError.message);
    return {
      error: 'We could not safely save the payment session. The order was cancelled; please retry.',
      resetIdempotency: true as const,
    };
  }

  return {
    success: true as const,
    orderId,
    orderNumber,
    checkoutUrl: session.url,
  };
}
