'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

// ─── helpers ────────────────────────────────────────────────────────────────

function revalidateOrderPaths(orderId: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
}

// ─── existing: processing → shipped | shipped → delivered ───────────────────

const transitionSchema = z.object({
  orderId: z.string().uuid(),
  expectedStatus: z.enum(['processing', 'shipped']),
  newStatus: z.enum(['shipped', 'delivered']),
  reason: z.string().trim().max(500),
}).refine(
  ({ expectedStatus, newStatus }) =>
    (expectedStatus === 'processing' && newStatus === 'shipped') ||
    (expectedStatus === 'shipped' && newStatus === 'delivered'),
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
    if (error.message.includes('ORDER_STATUS_CHANGED'))
      return { error: 'Another update changed this order. Refresh the page before trying again.' };
    if (error.message.includes('ORDER_INVALID_TRANSITION'))
      return { error: 'This order is not eligible for that fulfillment update.' };
    if (error.message.includes('ORDER_NOT_FOUND'))
      return { error: 'This order could not be found.' };
    if (error.code === 'PGRST202' || error.message.includes('admin_transition_order_status'))
      return { error: 'Apply the latest database/setup.sql before updating order fulfillment.' };
    return { error: 'Could not update order fulfillment. Please try again.' };
  }

  revalidateOrderPaths(parsed.data.orderId);
  return { success: true };
}

// ─── NEW: pending (paid) → processing ───────────────────────────────────────

export async function markOrderProcessing(orderId: string) {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) return { error: 'Admin access is required.' };

  const safeId = z.string().uuid().safeParse(orderId);
  if (!safeId.success) return { error: 'Invalid order ID.' };

  const admin = createAdminClient();

  // Verify the order is paid + pending before touching it
  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', safeId.data)
    .maybeSingle();

  if (fetchError || !order) return { error: 'Order not found.' };
  if (order.payment_status !== 'paid') return { error: 'Order must be paid before it can be processed.' };
  if (order.status !== 'pending') return { error: `Order is already ${order.status}.` };

  const { error: updateError } = await admin
    .from('orders')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', safeId.data)
    .eq('status', 'pending')
    .eq('payment_status', 'paid');

  if (updateError) {
    console.error('markOrderProcessing failed:', updateError.message);
    return { error: 'Could not mark order as processing. Please try again.' };
  }

  // Write audit row manually (service role bypasses RLS)
  await admin.from('order_status_history').insert({
    order_id: safeId.data,
    actor_user_id: adminUser.id,
    previous_status: 'pending',
    new_status: 'processing',
    reason: 'Admin confirmed payment and started fulfillment',
  });

  // Notify customer
  await admin.from('user_notifications').insert({
    user_id: order.id, // will be overridden below via subquery pattern
    order_id: safeId.data,
    type: 'order',
    title: 'Order processing',
    message: 'Your order is now being prepared for shipment.',
  }).select(); // fire-and-forget; ignore notification errors

  // Correct user_id: fetch from orders
  const { data: fullOrder } = await admin
    .from('orders')
    .select('user_id, order_number')
    .eq('id', safeId.data)
    .maybeSingle();

  if (fullOrder?.user_id) {
    await admin.from('user_notifications').insert({
      user_id: fullOrder.user_id,
      order_id: safeId.data,
      type: 'order',
      title: 'Order processing',
      message: `Your order #${fullOrder.order_number} is now being prepared for shipment.`,
    });
  }

  revalidateOrderPaths(safeId.data);
  return { success: true };
}

// ─── NEW: processing → shipped (with tracking info) ─────────────────────────

const shipSchema = z.object({
  orderId: z.string().uuid(),
  trackingNumber: z.string().trim().max(100).optional(),
  carrier: z.string().trim().max(60).optional(),
  reason: z.string().trim().max(500).optional(),
});

export async function markOrderShipped(input: unknown) {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) return { error: 'Admin access is required.' };

  const parsed = shipSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();

  // Use the existing RPC for audit trail
  const { error: rpcError } = await admin.rpc('admin_transition_order_status', {
    p_order_id: parsed.data.orderId,
    p_actor_user_id: adminUser.id,
    p_expected_status: 'processing',
    p_new_status: 'shipped',
    p_reason: parsed.data.reason || null,
  });

  if (rpcError) {
    console.error('markOrderShipped RPC failed:', rpcError.message);
    if (rpcError.message.includes('ORDER_STATUS_CHANGED'))
      return { error: 'Order status changed — refresh and try again.' };
    if (rpcError.message.includes('ORDER_INVALID_TRANSITION'))
      return { error: 'Order is not eligible to be marked shipped.' };
    return { error: 'Could not mark order as shipped. Please try again.' };
  }

  // Save tracking info if provided
  if (parsed.data.trackingNumber || parsed.data.carrier) {
    await admin
      .from('orders')
      .update({
        tracking_number: parsed.data.trackingNumber || null,
        carrier: parsed.data.carrier || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.orderId);
  }

  // Notify customer
  const { data: fullOrder } = await admin
    .from('orders')
    .select('user_id, order_number')
    .eq('id', parsed.data.orderId)
    .maybeSingle();

  if (fullOrder?.user_id) {
    const trackMsg = parsed.data.trackingNumber
      ? ` Tracking: ${parsed.data.trackingNumber}${parsed.data.carrier ? ` via ${parsed.data.carrier}` : ''}.`
      : '';
    await admin.from('user_notifications').insert({
      user_id: fullOrder.user_id,
      order_id: parsed.data.orderId,
      type: 'order',
      title: 'Order shipped',
      message: `Your order #${fullOrder.order_number} has been shipped.${trackMsg}`,
    });
  }

  revalidateOrderPaths(parsed.data.orderId);
  return { success: true };
}

// ─── NEW: shipped → delivered ────────────────────────────────────────────────

export async function markOrderDelivered(input: { orderId: string; reason?: string }) {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) return { error: 'Admin access is required.' };

  const safeId = z.string().uuid().safeParse(input.orderId);
  if (!safeId.success) return { error: 'Invalid order ID.' };

  const admin = createAdminClient();

  const { error } = await admin.rpc('admin_transition_order_status', {
    p_order_id: safeId.data,
    p_actor_user_id: adminUser.id,
    p_expected_status: 'shipped',
    p_new_status: 'delivered',
    p_reason: input.reason || null,
  });

  if (error) {
    console.error('markOrderDelivered failed:', error.message);
    if (error.message.includes('ORDER_STATUS_CHANGED'))
      return { error: 'Order status changed — refresh and try again.' };
    return { error: 'Could not mark order as delivered. Please try again.' };
  }

  // Notify customer
  const { data: fullOrder } = await admin
    .from('orders')
    .select('user_id, order_number')
    .eq('id', safeId.data)
    .maybeSingle();

  if (fullOrder?.user_id) {
    await admin.from('user_notifications').insert({
      user_id: fullOrder.user_id,
      order_id: safeId.data,
      type: 'order',
      title: 'Order delivered',
      message: `Your order #${fullOrder.order_number} has been delivered. Thank you for shopping with AK Drop!`,
    });
  }

  revalidateOrderPaths(safeId.data);
  return { success: true };
}

// ─── NEW: cancel unpaid / pending order ─────────────────────────────────────

export async function cancelOrder(orderId: string) {
  const adminUser = await getServerVerifiedAdmin();
  if (!adminUser) return { error: 'Admin access is required.' };

  const safeId = z.string().uuid().safeParse(orderId);
  if (!safeId.success) return { error: 'Invalid order ID.' };

  const admin = createAdminClient();

  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('id, status, payment_status, user_id, order_number')
    .eq('id', safeId.data)
    .maybeSingle();

  if (fetchError || !order) return { error: 'Order not found.' };
  if (order.payment_status === 'paid')
    return { error: 'Paid orders cannot be cancelled here. Issue a Stripe refund first.' };
  if (['shipped', 'delivered', 'cancelled'].includes(order.status))
    return { error: `Cannot cancel an order that is already ${order.status}.` };

  // For unpaid Stripe orders, call the cancel RPC to restore inventory
  if (order.payment_status === 'pending') {
    const { error: cancelRpcError } = await admin.rpc('cancel_unpaid_stripe_order', {
      p_order_id: safeId.data,
    });
    if (cancelRpcError) {
      console.error('cancelOrder RPC failed:', cancelRpcError.message);
      // Fall through to direct update if RPC missing
    }
  } else {
    // Direct cancel for already-failed-payment orders
    await admin
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', safeId.data);
  }

  // Write audit row
  await admin.from('order_status_history').insert({
    order_id: safeId.data,
    actor_user_id: adminUser.id,
    previous_status: order.status,
    new_status: 'cancelled',
    reason: 'Cancelled by admin',
  });

  // Notify customer
  if (order.user_id) {
    await admin.from('user_notifications').insert({
      user_id: order.user_id,
      order_id: safeId.data,
      type: 'order',
      title: 'Order cancelled',
      message: `Your order #${order.order_number} has been cancelled.`,
    });
  }

  revalidateOrderPaths(safeId.data);
  return { success: true };
}
