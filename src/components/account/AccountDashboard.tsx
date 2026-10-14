'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Package, Settings, LogOut, ShieldCheck, TrendingUp, Clock, Star, Bell } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { signOut } from '@/lib/auth-actions';
import dynamic from 'next/dynamic';

const ProfileSection = dynamic(() => import('./ProfileSection'), { loading: () => <div className="p-8 animate-pulse">Loading profile…</div> });
const OrdersSection = dynamic(() => import('./OrdersSection'), { loading: () => <div className="p-8 animate-pulse">Loading orders…</div> });
const NotificationsSection = dynamic(() => import('./NotificationsSection'), { loading: () => <div className="p-8 animate-pulse">Loading notifications…</div> });
const SettingsSection = dynamic(() => import('./SettingsSection'), { loading: () => <div className="p-8 animate-pulse">Loading settings…</div> });

interface AccountDashboardProps { user: SupabaseUser; profile: UserProfile | null; orders: any[]; }
type TabType = 'profile' | 'orders' | 'notifications' | 'settings';

function formatDate(value?: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function AccountDashboard({ user, profile, orders }: AccountDashboardProps) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(requestedTab && ['profile', 'orders', 'notifications', 'settings'].includes(requestedTab) ? requestedTab : 'profile');
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (requestedTab && ['profile', 'orders', 'notifications', 'settings'].includes(requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    const handleProfileUpdate = (event: Event) => setCurrentProfile((event as CustomEvent<UserProfile>).detail);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const displayName = currentProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Member';
  const avatarUrl = currentProfile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const memberSince = formatDate(currentProfile?.created_at || user.created_at);
  const verified = Boolean(user.email_confirmed_at || currentProfile?.is_verified);
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase() || 'AK';

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || order.order_cost || 0), 0);
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth() - 1);
    const recentOrders = orders.filter((order) => new Date(order.created_at).getTime() >= lastMonth.getTime()).length;
    return [
      { label: 'Total Orders', value: String(orders.length), note: recentOrders ? `${recentOrders} this month` : 'No orders yet', icon: Package, color: 'text-blue-400', wash: 'from-blue-500/15 to-transparent' },
      { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, note: orders.length ? 'Lifetime value' : 'Start your first order', icon: TrendingUp, color: 'text-green-400', wash: 'from-green-500/15 to-transparent' },
      { label: 'Member Since', value: memberSince, note: verified ? 'Verified account' : 'Email verification pending', icon: Clock, color: 'text-purple-400', wash: 'from-purple-500/15 to-transparent' },
    ];
  }, [orders, memberSince, verified]);

  const tabs = [
    { id: 'profile' as TabType, label: 'Edit Profile', icon: User, description: 'Update your personal info' },
    { id: 'orders' as TabType, label: 'My Orders', icon: Package, description: 'Track and view orders', badge: orders.length },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell, description: 'Manage alerts & updates' },
    { id: 'settings' as TabType, label: 'Settings & Privacy', icon: Settings, description: 'Security & preferences' },
  ];

  async function handleSignOut() {
    try { await signOut(); toast.success('Signed out successfully'); } catch { toast.error('Failed to sign out'); }
  }

  return <main className="min-h-screen bg-background pt-28 pb-12 px-4"><div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
    <section className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm"><div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" /><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" /><div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex min-w-0 items-center gap-4 sm:gap-5"><div className="relative shrink-0">{avatarUrl && !imageError ? <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-2xl object-cover shadow-lg sm:h-20 sm:w-20" referrerPolicy="no-referrer" onError={() => setImageError(true)} /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-xl font-black text-white shadow-lg sm:h-20 sm:w-20 sm:text-3xl">{initials}</div>}{verified && <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-green-500 text-white"><ShieldCheck size={14} /></span>}</div><div className="min-w-0"><h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">Welcome back, {displayName.split(/\s+/)[0]}!</h1><p className="truncate text-sm text-muted-foreground">{user.email}</p><div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><Star size={12} className="fill-yellow-400 text-yellow-400" /><span className="font-semibold">AK Drop member</span><span className="text-muted-foreground/40">·</span><span>Since {memberSince}</span></div></div></div><button type="button" onClick={handleSignOut} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 sm:self-auto"><LogOut size={16} />Sign out</button></div></section>
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">{stats.map(({ label, value, note, icon: Icon, color, wash }) => <div key={label} className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm"><div className={`absolute inset-0 bg-gradient-to-br ${wash}`} /><div className="relative flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p><p className="mt-1.5 text-[11px] text-muted-foreground">{note}</p></div><div className="rounded-xl bg-secondary/60 p-3"><Icon size={20} className={color} /></div></div></div>)}</section>
    <section className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"><nav className="flex gap-1 overflow-x-auto border-b border-border p-2" aria-label="Account sections">{tabs.map(({ id, label, icon: Icon, badge }) => <button type="button" key={id} onClick={() => setActiveTab(id)} className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}><Icon size={16} /><span>{label}</span>{badge ? <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">{badge}</span> : null}{activeTab === id && <span className="absolute inset-x-3 -bottom-2 h-0.5 bg-primary" />}</button>)}</nav><div className="p-5 sm:p-8"><Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-secondary/30" />}>{activeTab === 'profile' && <ProfileSection user={user} profile={currentProfile} />}{activeTab === 'orders' && <OrdersSection orders={orders} />}{activeTab === 'notifications' && <NotificationsSection orders={orders} profile={currentProfile} />}{activeTab === 'settings' && <SettingsSection user={user} profile={currentProfile} />}</Suspense></div></section>
  </div></main>;
}
