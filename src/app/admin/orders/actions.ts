'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

const transitionSchema = z.object({
  orderId: z.string().uuid(),
  expectedStatus: z.enum(['processing', 'shipped']),
  newStatus: z.enum(['shipped', 'delivered']),
  reason: z.string().trim().max(500),
}).refine(
  ({ expectedStatus, newStatus }) =>
    (expectedStatus === 'processing' && newStatus === 'shipped')
    || (expectedStatus === 'shipped' && newStatus === 'delivered'),
  { message: 'This order status change is not allowed.' },
);

export async function updateFulfillmentStatus(input: unknown) {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) return { error: 'Admin access is required to update fulfillment.' };

  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Review the order update and try again.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc('admin_transition_order_status', {
    p_order_id: parsed.data.orderId,
    p_actor_user_id: adminUser.id,
    p_expected_status: parsed.data.expectedStatus,
    p_new_status: parsed.data.newStatus,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    console.error('Admin fulfillment update failed:', error.message);
    if (error.message.includes('ORDER_STATUS_CHANGED')) {
      return { error: 'Another update changed this order. Refresh the page before trying again.' };
    }
    if (error.message.includes('ORDER_INVALID_TRANSITION')) {
      return { error: 'This order is not eligible for that fulfillment update.' };
    }
    if (error.message.includes('ORDER_NOT_FOUND')) {
      return { error: 'This order could not be found.' };
    }
    if (error.code === 'PGRST202' || error.message.includes('admin_transition_order_status')) {
      return { error: 'Apply the latest database/setup.sql before updating order fulfillment.' };
    }
    return { error: 'Could not update order fulfillment. Please try again.' };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath(`/orders/${parsed.data.orderId}`);
  return { success: true };
}
