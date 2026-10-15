'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import AuthPageShell from '@/components/auth/AuthPageShell';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

function safeRedirect(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const urlError = searchParams.get('error');
  const redirectTo = safeRedirect(searchParams.get('redirect'));

  async function handleEmailSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error('Invalid email or password. Please try again.');
        return;
      }

      toast.success('Welcome back to AK Drop!');
      router.replace(redirectTo);
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthPageShell>
      <header className="mb-7">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
          AK Drop account
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to continue shopping.
        </p>
      </header>

      {urlError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{urlError}</span>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/5 sm:p-7">
        <GoogleAuthButton redirectTo={redirectTo} />

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            or use email
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <label
            htmlFor="email"
            className="block space-y-2 text-sm font-semibold"
          >
            Email address
            <span className="relative block">
              <Mail
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={17}
              />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </span>
          </label>

          <label
            htmlFor="password"
            className="block space-y-2 text-sm font-semibold"
          >
            Password
            <span className="relative block">
              <Lock
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={17}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              'Signing in…'
            ) : (
              <>
                <Sparkles size={16} />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          New to AK Drop?{' '}
          <Link
            href="/auth/signup"
            className="font-bold text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
        By continuing, you agree to AK Drop&apos;s Terms and Privacy Policy.
      </p>
    </AuthPageShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
