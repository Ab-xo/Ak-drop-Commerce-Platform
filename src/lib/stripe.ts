import 'server-only';
import Stripe from 'stripe';

let stripeClient: Stripe | undefined;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('Stripe is not configured. Add a Stripe test secret key to .env.local.');
  }
  if (!secretKey.startsWith('sk_test_')) {
    throw new Error('AK Drop checkout is restricted to Stripe test mode. Use an sk_test_ key.');
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    throw new Error('Set NEXT_PUBLIC_SITE_URL before enabling Stripe Checkout.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(siteUrl);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be a valid absolute URL.');
  }

  if (
    parsedUrl.protocol !== 'https:' &&
    !(parsedUrl.protocol === 'http:' && parsedUrl.hostname === 'localhost')
  ) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS outside localhost.');
  }

  return parsedUrl.origin;
}
