import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import CheckoutForm from '@/components/checkout/CheckoutForm';

function readAddressValue(address: Record<string, unknown> | null, key: string) {
  const value = address?.[key];
  return typeof value === 'string' ? value : '';
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError && userError.message !== 'Auth session missing!') {
    console.error('Checkout authentication error:', userError.message);
    throw new Error('Unable to verify your sign-in. Please try again.');
  }
  if (!user) redirect('/auth/signin?redirect=/checkout');

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('full_name, email, phone, address')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Checkout profile lookup error:', profileError.message);
    throw new Error('Unable to load your saved delivery details.');
  }

  const savedAddress = profile?.address as Record<string, unknown> | null;
  return (
    <CheckoutForm
      paymentCancelled={params.cancelled === '1'}
      initialAddress={{
        full_name: profile?.full_name || String(user.user_metadata?.full_name || user.user_metadata?.name || ''),
        email: profile?.email || user.email || '',
        phone: profile?.phone || '',
        country: readAddressValue(savedAddress, 'country'),
        address: readAddressValue(savedAddress, 'address'),
        city: readAddressValue(savedAddress, 'city'),
        region: readAddressValue(savedAddress, 'region'),
        postal_code: readAddressValue(savedAddress, 'postal_code'),
        delivery_instructions: '',
      }}
    />
  );
}
