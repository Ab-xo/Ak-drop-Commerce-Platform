'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, Clock3, Package, Sparkles, Tag, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import type { UserNotification } from '@/types';

type Filter = 'all' | 'unread';

function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function notifyNavbar() {
  window.dispatchEvent(new Event('akdrop:notifications-changed'));
}

export default function NotificationsSection({ notifications: initialNotifications }: { notifications: UserNotification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>('unread');
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const visible = useMemo(
    () => notifications
      .filter((notification) => filter === 'all' || !notification.is_read)
      .sort((left, right) => {
        if (left.is_read !== right.is_read) return left.is_read ? 1 : -1;
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      }),
    [notifications, filter],
  );

  async function markRead(id: string) {
    if (pendingIds.includes(id)) return;
    setPendingIds((ids) => [...ids, id]);
    const { error } = await createClient()
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', id);
    setPendingIds((ids) => ids.filter((pendingId) => pendingId !== id));

    if (error) {
      console.error('Notification read update failed:', error.message);
      toast.error('Could not update this notification. Try again.');
      return;
    }
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item));
    notifyNavbar();
  }

  async function deleteNotification(id: string) {
    if (pendingIds.includes(id)) return;
    setPendingIds((ids) => [...ids, id]);
    const { error } = await createClient()
      .from('user_notifications')
      .delete()
      .eq('id', id);
    setPendingIds((ids) => ids.filter((pendingId) => pendingId !== id));

    if (error) {
      console.error('Notification delete failed:', error.message);
      toast.error('Could not delete this notification. Try again.');
      return;
    }
    setNotifications((items) => items.filter((item) => item.id !== id));
    notifyNavbar();
  }

  const iconFor = (type: UserNotification['type']) => {
    if (type === 'order') return Package;
    if (type === 'promo') return Tag;
    return UserRound;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black">
            <span className="rounded-xl bg-primary/10 p-2.5"><Bell size={22} className="text-primary" /></span>
            Notifications
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {unreadCount ? `${unreadCount} update${unreadCount === 1 ? '' : 's'} waiting in your inbox` : 'You are all caught up.'}
          </p>
        </div>
      </header>

      <div className="inline-flex rounded-2xl border border-border bg-secondary/40 p-1">
        {([
          ['unread', 'Inbox', unreadCount],
          ['all', 'All activity', notifications.length],
        ] as const).map(([id, label, count]) => (
          <button
            type="button"
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${filter === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {label}<span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${filter === id ? 'bg-primary/10 text-primary' : 'bg-background/70'}`}>{count}</span>
          </button>
        ))}
      </div>

      {!visible.length ? (
        <div className="rounded-2xl border border-border bg-background py-16 text-center">
          <Sparkles size={36} className="mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-bold">{filter === 'unread' ? 'Your inbox is clear' : 'No notifications yet'}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{filter === 'unread' ? 'New order updates and account activity will wait here.' : 'Order updates and account activity will appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visible.map((item) => {
              const Icon = iconFor(item.type);
              const isPending = pendingIds.includes(item.id);
              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors sm:p-5 ${item.is_read ? 'border-border bg-background' : 'border-primary/30 bg-gradient-to-r from-primary/[0.07] to-background'}`}
                >
                  <div className={`relative rounded-xl p-3 ${item.is_read ? 'bg-secondary/60' : 'bg-primary/10'}`}>
                    {!item.is_read && <span aria-label="Unread" className="absolute -right-1 -top-1 size-2.5 rounded-full bg-primary ring-2 ring-background" />}
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.order_id ? (
                      <Link href={`/orders/${item.order_id}`} className="font-semibold transition hover:text-primary">{item.title}</Link>
                    ) : (
                      <h3 className="font-semibold">{item.title}</h3>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <Clock3 size={12} />{relativeDate(item.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!item.is_read && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => markRead(item.id)}
                        className="rounded-lg p-2 transition hover:bg-primary/10 disabled:opacity-50"
                        title="Mark as read"
                        aria-label={`Mark ${item.title} as read`}
                      >
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary">
                          <Check size={15} />Mark read
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => deleteNotification(item.id)}
                      className="rounded-lg p-2 transition hover:bg-red-500/10 disabled:opacity-50"
                      title="Delete notification"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
