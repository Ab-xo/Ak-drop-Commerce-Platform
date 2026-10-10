import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AccountDashboard from '@/components/account/AccountDashboard';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect('/auth/signin?redirect=/account');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <AccountDashboard
      user={user}
      profile={profile}
      orders={orders || []}
    />
  );
}
