import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AccountDashboard from '@/components/account/AccountDashboard';
import type { OrderSummary, UserNotification } from '@/types';
import { isNotificationsTableMissing } from '@/lib/notification-errors';

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
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, user_id, order_number, status, total_amount, subtotal_amount, delivery_fee_amount, total_is_final, currency, payment_method, payment_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (ordersError || !orders) {
    console.error('Account order history error:', ordersError?.message ?? 'No order data returned.');
    throw new Error('Unable to load your order history.');
  }

  const { data: notifications, error: notificationsError } = await supabase
    .from('user_notifications')
    .select('id, order_id, type, title, message, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const notificationsTableReady = !notificationsError || !isNotificationsTableMissing(notificationsError);
  if (notificationsError && !notificationsTableReady) {
    console.warn('Customer notifications are not enabled in Supabase yet. Run the latest database/setup.sql to create public.user_notifications.');
  } else if (notificationsError) {
    console.error('Account notifications error:', notificationsError?.message ?? 'No notification data returned.');
    throw new Error('Unable to load your notifications.');
  }
  if (notificationsTableReady && !notifications) {
    console.error('Account notifications error: No notification data returned.');
    throw new Error('Unable to load your notifications.');
  }

  const orderSummaries: OrderSummary[] = orders;
  const userNotifications: UserNotification[] = notifications ?? [];

  return (
    <AccountDashboard
      user={user}
      profile={profile}
      orders={orderSummaries}
      notifications={userNotifications}
      notificationsTableReady={notificationsTableReady}
    />
  );
}
