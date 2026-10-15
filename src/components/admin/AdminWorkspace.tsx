import Link from 'next/link';
import type { ReactNode } from 'react';
import { Activity, Boxes, ExternalLink, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { signOutAdmin } from '@/app/admin/actions';

export default function AdminWorkspace({
  children,
  email,
  activePage,
}: {
  children: ReactNode;
  email: string;
  activePage: 'overview' | 'products';
}) {
  const initials = email.split('@')[0]?.slice(0, 2).toUpperCase() || 'AK';
  const navigation = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, active: activePage === 'overview' },
    { href: '/admin/products', label: 'Products', icon: Boxes, active: activePage === 'products' },
  ];

  return (
    <div className="min-h-svh bg-secondary/30 lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="border-b border-border/80 bg-card/90 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-[4.75rem] items-center gap-3 border-b border-border/80 px-5">
          <span className="flex size-9 -rotate-6 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-lg shadow-primary/20">AK</span>
          <span className="text-sm font-black tracking-[0.2em]">DROP</span>
          <span className="ml-auto rounded-full border border-primary/20 bg-primary/[0.06] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">Studio</span>
        </div>

        <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4 lg:py-7">
          <p className="hidden px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground lg:block">Workspace</p>
          {navigation.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`group flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={17} className={active ? '' : 'transition-transform group-hover:scale-110'} /> {label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/80" />}
            </Link>
          ))}
          <Link
            href="/"
            className="ml-auto flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-3 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:ml-0 lg:mt-auto lg:text-sm"
          >
            <ExternalLink size={15} /> View storefront
          </Link>
        </nav>

        <div className="hidden border-t border-border p-4 lg:block">
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/40 p-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={17} />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold">Workspace secured</span>
              <span className="block truncate text-[10px] text-muted-foreground">{email}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
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
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-muted-foreground">All systems operational</span>
            </div>
            <span aria-label={`Signed in as ${email}`} title={email} className="flex size-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[11px] font-black text-primary">
              {initials}
            </span>
            <form action={signOutAdmin}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/[0.05] hover:text-destructive sm:px-3.5 sm:text-sm">
                <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
