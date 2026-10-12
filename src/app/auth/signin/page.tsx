'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlError) toast.error(decodeURIComponent(urlError));
  }, [urlError]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.success('Welcome back to AK Drop!');
        setTimeout(() => router.push('/'), 300);
        router.refresh();
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) {
        toast.error(error.message || 'Failed to sign in with Google.');
        setIsGoogleLoading(false);
      }
    } catch {
      toast.error('Failed to connect to Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left image panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=90&w=1400"
          alt="AK Drop premium footwear"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Dark scrim */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />

        {/* Panel content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300">
              AK
            </span>
            <span className="text-xl font-black tracking-[.18em] uppercase text-white">DROP</span>
          </Link>

          {/* Quote */}
          <div className="space-y-6">
            <div className="w-12 h-1 bg-primary rounded-full" />
            <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white leading-tight">
              STYLE THAT<br /><span className="text-primary">MOVES YOU</span>
            </h2>
            <p className="text-white/70 text-lg font-medium max-w-xs">
              Premium footwear, apparel & accessories — curated for Addis Ababa and beyond.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest hover:gap-4 transition-all"
            >
              Explore the drop <ArrowRight size={16} />
            </Link>
          </div>

          {/* Slide indicators */}
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            AK Drop — Addis Ababa, Ethiopia
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm rotate-[-8deg]">
              AK
            </span>
            <span className="text-lg font-black tracking-[.18em] uppercase">DROP</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">
              Welcome <span className="text-primary">Back</span>
            </h1>
            <p className="text-foreground/50 text-sm">Sign in to your AK Drop account to continue.</p>
          </div>

          {/* URL error */}
          <AnimatePresence>
            {urlError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{decodeURIComponent(urlError)}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
            <div className="p-8 space-y-6">

              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-background border border-border py-3.5 px-4 rounded-xl font-medium text-sm hover:bg-foreground/5 hover:border-primary/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-foreground/20 border-t-primary rounded-full animate-spin" />
                    Redirecting to Google...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-foreground/40 uppercase tracking-widest font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email / password form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} />
                    <input
                      id="email" type="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} />
                    <input
                      id="password" type={showPassword ? 'text' : 'password'} required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors p-1">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-black text-sm uppercase italic tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Signing in...</>
                  ) : (
                    <><Sparkles size={15} />Sign In</>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-foreground/50">
                No account yet?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline font-bold">
                  Create one free
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-foreground/30 mt-6">
            By continuing, you agree to AK Drop&apos;s Terms &amp; Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
