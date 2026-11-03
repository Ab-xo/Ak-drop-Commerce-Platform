import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Activity, Boxes, ExternalLink, LayoutDashboard,
  LogOut, PackageCheck, ShieldCheck, Users,
} from 'lucide-react';
import { signOutAdmin } from '@/app/admin/actions';

export default function AdminWorkspace({
  children,
  email,
  activePage,
  pendingOrderCount,
}: {
  children: ReactNode;
  email: string;
  activePage: 'overview' | 'products' | 'orders' | 'customers';
  pendingOrderCount?: number;
}) {
  const initials = email.split('@')[0]?.slice(0, 2).toUpperCase() || 'AK';
  const displayName = email.split('@')[0] ?? 'Admin';

  const navigation = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, active: activePage === 'overview' },
    { href: '/admin/products', label: 'Products', icon: Boxes, active: activePage === 'products' },
    { href: '/admin/orders', label: 'Orders', icon: PackageCheck, active: activePage === 'orders', badge: pendingOrderCount },
    { href: '/admin/customers', label: 'Customers', icon: Users, active: activePage === 'customers' },
  ];

  return (
    <div className="min-h-svh bg-secondary/30 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">

      {/* ── Sidebar ── */}
      <aside className="border-b border-border/80 bg-card/95 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:border-b-0 lg:border-r">

        {/* Logo */}
        <div className="flex h-[4.75rem] items-center gap-3 border-b border-border/80 px-5">
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-lg shadow-primary/25">
            AK
            <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-[0.18em]">DROP</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Admin Studio</p>
          </div>
          <span className="ml-auto rounded-full border border-primary/20 bg-primary/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
            v2
          </span>
        </div>

        {/* Nav */}
        <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4 lg:py-6">
          <p className="hidden px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground lg:block">
            Workspace
          </p>
          {navigation.map(({ href, label, icon: Icon, active, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition
                ${active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <Icon size={17} className={active ? '' : 'transition-transform duration-200 group-hover:scale-110'} />
              {label}
              {badge !== undefined && badge > 0 && (
                <span className={`ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-black
                  ${active ? 'bg-primary-foreground/25 text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/70" />}
            </Link>
          ))}

          <div className="mt-3 hidden border-t border-border/60 pt-3 lg:block">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Store</p>
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ExternalLink size={17} className="transition-transform duration-200 group-hover:scale-110" />
              View storefront
            </Link>
          </div>

          {/* Mobile-only storefront link */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <ExternalLink size={17} /> Storefront
          </Link>
        </nav>

        {/* User card */}
        <div className="hidden border-t border-border/60 p-4 lg:block">
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/40 p-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-black text-primary">
              {initials}
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold capitalize">{displayName}</p>
              <div className="mt-0.5 flex items-center gap-1">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Admin</span>
              </div>
            </div>
            <form action={signOutAdmin}>
              <button
                type="submit"
                title="Sign out"
                className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/[0.06] hover:text-destructive"
              >
                <LogOut size={14} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[4.75rem] items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-2xl sm:px-7 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground sm:flex">
              <Activity size={16} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">AK Drop commerce</p>
              <p className="truncate text-sm font-bold">Admin workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status indicator */}
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">Verified admin session</span>
            </div>

            {/* Avatar */}
            <span
              aria-label={`Signed in as ${email}`}
              title={email}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[11px] font-black text-primary"
            >
              {initials}
            </span>

            {/* Sign out */}
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/[0.05] hover:text-destructive sm:px-3.5 sm:text-sm"
              >
                <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
