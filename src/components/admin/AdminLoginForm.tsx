'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { signInAdmin, type AdminLoginState } from '@/app/admin/login/actions';

const initialState: AdminLoginState = { error: null };

export default function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(signInAdmin, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-[-10rem] size-[32rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-48 -right-32 size-[34rem] rounded-full bg-violet-500/[0.08] blur-[130px]" />
      </div>

      <section className="w-full max-w-[27rem]">
        <Link href="/" className="mb-9 inline-flex items-center gap-3">
          <span className="flex size-11 -rotate-6 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
            AK
          </span>
          <span className="text-sm font-black tracking-[0.24em]">DROP</span>
        </Link>

        <div className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/90 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-sky-500" />
          <div className="p-6 sm:p-8">
            <div className="mb-7 flex size-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <ShieldCheck size={23} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Staff access</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Admin sign in</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in with an authorized AK Drop staff account to manage your store.
            </p>

            <form action={formAction} className="mt-7 space-y-4">
              <label htmlFor="admin-email" className="block space-y-2 text-sm font-semibold">
                Email address
                <span className="relative block">
                  <Mail size={17} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </span>
              </label>

              <label htmlFor="admin-password" className="block space-y-2 text-sm font-semibold">
                Password
                <span className="relative block">
                  <LockKeyhole size={17} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              {state.error && (
                <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/[0.08] px-3.5 py-3 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {isPending ? 'Verifying access…' : 'Continue to dashboard'}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-secondary/50 px-3.5 py-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" />
              Admin access is verified securely by the server. Customer accounts cannot access this workspace.
            </div>
          </div>
        </div>

        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft size={15} /> Return to AK Drop
        </Link>
      </section>
    </main>
  );
}
