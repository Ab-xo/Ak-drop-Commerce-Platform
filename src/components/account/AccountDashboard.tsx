'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Package, Settings, LogOut, ShieldCheck,
  TrendingUp, Clock, Star, Bell
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { signOut } from '@/lib/auth-actions';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ProfileSection = dynamic(() => import('./ProfileSection'), {
  loading: () => <div className="p-8 space-y-4">
    <div className="h-6 w-48 bg-primary/20 animate-pulse rounded" />
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-secondary/20 animate-pulse rounded-xl" />
      ))}
    </div>
  </div>,
});

const OrdersSection = dynamic(() => import('./OrdersSection'), {
  loading: () => <div className="p-8 space-y-4">
    <div className="h-6 w-32 bg-primary/20 animate-pulse rounded" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-24 bg-secondary/20 animate-pulse rounded-xl" />
    ))}
  </div>,
});

const NotificationsSection = dynamic(() => import('./NotificationsSection'), {
  loading: () => <div className="p-8 space-y-4">
    <div className="h-6 w-36 bg-primary/20 animate-pulse rounded" />
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-20 bg-secondary/20 animate-pulse rounded-xl" />
    ))}
  </div>,
});

const SettingsSection = dynamic(() => import('./SettingsSection'), {
  loading: () => <div className="p-8 space-y-4">
    <div className="h-6 w-40 bg-primary/20 animate-pulse rounded" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-32 bg-secondary/20 animate-pulse rounded-xl" />
    ))}
  </div>,
});

interface AccountDashboardProps {
  user: SupabaseUser;
  profile: UserProfile | null;
  orders: any[];
}

type TabType = 'profile' | 'orders' | 'notifications' | 'settings';

export default function AccountDashboard({ user, profile, orders }: AccountDashboardProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'profile');
  const [imageError, setImageError] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam && ['profile', 'orders', 'notifications', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedProfile = event.detail;
      setCurrentProfile(updatedProfile);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User, description: 'Personal info' },
    { id: 'orders' as TabType, label: 'Orders', icon: Package, description: 'Order history', badge: orders.length || null },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell, description: 'Updates', badge: 3 },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, description: 'Security & prefs' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  // Get user display name — prefer profile name, then Google metadata, then email prefix
  

  // Get user initials for avatar
  const getInitials = () => {
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Avatar URL (Google OAuth provides one)

  // Memoize expensive calculations
  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || order.order_cost || 0), 0);
    const memberSince = new Date(user.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const isVerified = !!user.email_confirmed_at;

    return [
      {
        label: 'Total Orders',
        value: orders.length.toString(),
        icon: Package,
        color: 'from-blue-500/20 to-blue-600/10',
        iconColor: 'text-blue-400',
        trend: '+2 this month',
      },
      {
        label: 'Total Spent',
        value: `$${totalSpent.toFixed(2)}`,
        icon: TrendingUp,
        color: 'from-green-500/20 to-green-600/10',
        iconColor: 'text-green-400',
        trend: 'Lifetime value',
      },
      {
        label: 'Member Since',
        value: memberSince,
        icon: Clock,
        color: 'from-purple-500/20 to-purple-600/10',
        iconColor: 'text-purple-400',
        trend: isVerified ? '✓ Verified' : '⚠ Unverified',
      },
    ];
  }, [orders, user]);

  // Memoize display values
  const { displayName, avatarUrl, isVerified, memberSince } = useMemo(() => ({
    displayName: currentProfile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User',
    avatarUrl: currentProfile?.avatar_url || user.user_metadata?.avatar_url || null,
    isVerified: !!user.email_confirmed_at,
    memberSince: new Date(user.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  }), [currentProfile, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)',
          }}
        >
          {/* Decorative gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500" />

          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {getInitials()}
                  </div>
                )}
                {isVerified && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-background">
                    <ShieldCheck size={14} className="text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Welcome back, {displayName.split(' ')[0]}!
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-muted-foreground font-medium">Premium Member</span>
                  <span className="text-muted-foreground/30 mx-1">·</span>
                  <span className="text-xs text-muted-foreground">Since {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all duration-200 font-medium text-sm group flex-shrink-0"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="relative rounded-xl p-5 overflow-hidden"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 16px -4px rgba(0,0,0,0.15)',
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{stat.trend}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
                  <stat.icon size={20} className={stat.iconColor} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab Navigation + Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 8px 24px -8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Tab Bar */}
          <div className="flex border-b border-border bg-background/30">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2.5 px-6 py-4 font-medium text-sm transition-all duration-200 whitespace-nowrap group ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <Icon size={16} className="transition-colors" />
                  <span>{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full leading-none">
                      {tab.badge}
                    </span>
                  )}
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <Suspense fallback={<div className="h-32 bg-secondary/20 animate-pulse rounded-xl" />}>
                  {activeTab === 'profile' && (
                    <ProfileSection user={user} profile={currentProfile} />
                  )}
                  {activeTab === 'orders' && (
                    <OrdersSection orders={orders} />
                  )}
                  {activeTab === 'notifications' && (
                    <NotificationsSection />
                  )}
                  {activeTab === 'settings' && (
                    <SettingsSection user={user} profile={currentProfile} />
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
