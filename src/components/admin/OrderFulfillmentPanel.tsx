'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateFulfillmentStatus } from '@/app/admin/orders/actions';

export default function OrderFulfillmentPanel({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const nextStatus = status === 'processing' ? 'shipped' : status === 'shipped' ? 'delivered' : null;
  const canUpdate = paymentStatus === 'paid' && nextStatus !== null;

  async function submitUpdate() {
    if (!nextStatus) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await updateFulfillmentStatus({
        orderId,
        expectedStatus: status,
        newStatus: nextStatus,
        reason,
      });
      if (result.error) {
        setFeedback({ kind: 'error', message: result.error });
        return;
      }
      setFeedback({ kind: 'success', message: `Order marked ${nextStatus}.` });
      setReason('');
      router.refresh();
    } catch (error) {
      console.error('Admin fulfillment request failed:', error);
      setFeedback({ kind: 'error', message: 'Could not update fulfillment. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-bold">Fulfillment</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Only forward fulfillment updates for paid orders are available here. Payment and refund states are provider-controlled.
      </p>
      {canUpdate ? (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold">
            Optional fulfillment note
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
          </label>
          <button type="button" onClick={submitUpdate} disabled={isSaving}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
            {isSaving ? 'Saving…' : `Mark as ${nextStatus}`}
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-secondary/60 px-3 py-2.5 text-xs font-medium text-muted-foreground">
          {paymentStatus !== 'paid'
            ? 'Fulfillment actions unlock after payment is verified.'
            : `No further fulfillment action is available for an order marked ${status}.`}
        </p>
      )}
      {feedback && (
        <p role="status" className={`mt-3 text-xs font-medium ${feedback.kind === 'error' ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}
