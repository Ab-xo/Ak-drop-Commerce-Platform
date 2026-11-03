'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, CheckCircle2, Clock, Loader2, Package,
  PackageCheck, Truck, XCircle, Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  markOrderProcessing,
  markOrderShipped,
  markOrderDelivered,
  cancelOrder,
} from '@/app/admin/orders/actions';

type Stage = 'pending_payment' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STAGES: { key: Stage; label: string; icon: React.ElementType }[] = [
  { key: 'pending_payment', label: 'Awaiting Payment', icon: Clock },
  { key: 'pending', label: 'Paid · Pending', icon: Package },
  { key: 'processing', label: 'Processing', icon: PackageCheck },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function getStage(status: string, paymentStatus: string): Stage {
  if (status === 'cancelled') return 'cancelled';
  if (paymentStatus !== 'paid') return 'pending_payment';
  if (status === 'pending') return 'pending';
  return status as Stage;
}

const CARRIERS = ['DHL', 'FedEx', 'EMS', 'Local Courier', 'Other'];

export default function OrderFulfillmentPanel({
  orderId,
  status,
  paymentStatus,
  trackingNumber: initialTracking,
  carrier: initialCarrier,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string | null;
  carrier?: string | null;
}) {
  const router = useRouter();
  const stage = getStage(status, paymentStatus);
  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState(initialTracking ?? '');
  const [carrier, setCarrier] = useState(initialCarrier ?? '');
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function run<T>(
    action: () => Promise<{ success?: boolean; error?: string } | T>,
    successMsg: string,
  ) {
    setBusy(true);
    try {
      const result = await action() as { success?: boolean; error?: string };
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(successMsg);
        router.refresh();
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/[0.06] to-transparent px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Truck size={16} />
          </span>
          <div>
            <h2 className="font-bold leading-none">Fulfillment</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Order lifecycle control</p>
          </div>
        </div>
        <Badge
          variant={
            stage === 'delivered' ? 'success' :
            stage === 'cancelled' ? 'destructive' :
            stage === 'shipped' ? 'info' :
            stage === 'processing' ? 'purple' :
            stage === 'pending' ? 'warning' : 'secondary'
          }
          className="capitalize"
        >
          {stage.replace('_', ' ')}
        </Badge>
      </div>

      {/* Progress stepper */}
      {stage !== 'cancelled' && (
        <div className="border-b border-border px-5 py-5">
          <div className="relative flex items-start justify-between">
            {/* connector line */}
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-border" />
            <div
              className="absolute left-4 top-4 h-0.5 bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, stageIndex / (STAGES.length - 1)) * 100}%` }}
            />
            {STAGES.map((s, i) => {
              const done = i < stageIndex;
              const active = i === stageIndex;
              const Icon = s.icon;
              return (
                <div key={s.key} className="relative flex flex-col items-center gap-1.5 z-10">
                  <span className={`flex size-8 items-center justify-center rounded-full ring-2 ring-background transition-all
                    ${done ? 'bg-primary text-primary-foreground' :
                      active ? 'bg-primary/10 text-primary ring-2 ring-primary/30' :
                      'bg-secondary text-muted-foreground'}`}>
                    {done ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                  </span>
                  <span className={`hidden text-[10px] font-semibold text-center sm:block leading-tight
                    ${active ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action area */}
      <div className="p-5 space-y-4">

        {/* ── Awaiting payment ── */}
        {stage === 'pending_payment' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3.5">
              <Clock size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                Waiting for Stripe payment confirmation. Payment records update automatically via webhook.
              </p>
            </div>
            {!confirmCancel ? (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setConfirmCancel(true)}
                disabled={busy}
              >
                <Ban size={15} /> Cancel unpaid order
              </Button>
            ) : (
              <div className="rounded-xl border border-destructive/30 bg-destructive/[0.06] p-4 space-y-3">
                <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle size={15} /> Confirm cancellation?
                </p>
                <p className="text-xs text-muted-foreground">
                  This will restore inventory and mark the order cancelled. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => run(() => cancelOrder(orderId), 'Order cancelled successfully.')}
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Yes, cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmCancel(false)}
                    disabled={busy}
                  >
                    Keep order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Paid · Pending → mark processing ── */}
        {stage === 'pending' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                Payment confirmed. Start fulfillment by marking this order as processing.
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold">Internal note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="e.g. Stock allocated, ready to pack…"
                className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => run(() => markOrderProcessing(orderId), 'Order marked as processing. Customer notified.')}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
              Mark as Processing
            </Button>
          </div>
        )}

        {/* ── Processing → mark shipped ── */}
        {stage === 'processing' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3.5">
              <PackageCheck size={16} className="mt-0.5 shrink-0 text-sky-500" />
              <p className="text-sm text-muted-foreground">
                Enter tracking details and mark the order as shipped. The customer will be notified.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold">Tracking number</span>
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold">Carrier</span>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="">Select carrier…</option>
                  {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold">Note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Dispatch details or instructions…"
                className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <Button
              variant="success"
              className="w-full"
              disabled={busy}
              onClick={() =>
                run(
                  () => markOrderShipped({ orderId, trackingNumber: tracking || undefined, carrier: carrier || undefined, reason: note || undefined }),
                  'Order marked as shipped. Customer notified.',
                )
              }
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
              Mark as Shipped
            </Button>
          </div>
        )}

        {/* ── Shipped → mark delivered ── */}
        {stage === 'shipped' && (
          <div className="space-y-3">
            {(initialTracking || initialCarrier) && (
              <div className="rounded-xl border border-border bg-secondary/40 p-3.5 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Tracking info</p>
                {initialCarrier && <p className="font-semibold">{initialCarrier}</p>}
                {initialTracking && <p className="font-mono text-xs text-muted-foreground mt-0.5">{initialTracking}</p>}
              </div>
            )}
            <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3.5">
              <Truck size={16} className="mt-0.5 shrink-0 text-violet-500" />
              <p className="text-sm text-muted-foreground">
                Confirm delivery once the customer has received the order.
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold">Delivery note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="e.g. Confirmed by customer…"
                className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <Button
              variant="success"
              className="w-full"
              disabled={busy}
              onClick={() =>
                run(
                  () => markOrderDelivered({ orderId, reason: note || undefined }),
                  'Order marked as delivered. Customer notified.',
                )
              }
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Mark as Delivered
            </Button>
          </div>
        )}

        {/* ── Delivered ── */}
        {stage === 'delivered' && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">Order delivered</p>
              <p className="mt-1 text-xs text-muted-foreground">This order has been fulfilled and delivered. No further actions are available.</p>
            </div>
          </div>
        )}

        {/* ── Cancelled ── */}
        {stage === 'cancelled' && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.06] p-4">
            <XCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Order cancelled</p>
              <p className="mt-1 text-xs text-muted-foreground">This order was cancelled. Inventory has been restored.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
