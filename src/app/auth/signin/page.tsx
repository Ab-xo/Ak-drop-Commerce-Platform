'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Inner component that uses useSearchParams
function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Read error from URL params (e.g. from OAuth callback failures)
  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlError) {
      toast.error(decodeURIComponent(urlError));
    }
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
        toast.success('Welcome back!');
        // Small delay to let auth state update, then redirect
        setTimeout(() => router.push('/'), 300);
        router.refresh();
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth — always client-side
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        toast.error(error.message || 'Failed to sign in with Google.');
        setIsGoogleLoading(false);
      }
      // On success, browser is redirected by Supabase — don't reset loading
    } catch {
      toast.error('Failed to connect to Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-12 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="flex items-center">
              <div className="relative">
                <span className="text-3xl font-black tracking-tight text-foreground">A</span>
                <span className="text-3xl font-black tracking-tight text-foreground relative">
                  K
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary transform rotate-45" />
                </span>
              </div>
              <div className="w-px h-6 bg-border mx-3" />
              <span className="text-xl font-semibold tracking-wide text-foreground/90 uppercase">ECOMM</span>
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-foreground/60 text-sm">Sign in to your AK ECOMM account</p>
        </div>

        {/* URL Error Banner */}
        <AnimatePresence>
          {urlError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{decodeURIComponent(urlError)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
        >
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />

          <div className="p-8">
            {/* Google Button — primary CTA */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              id="google-signin-btn"
              className="w-full flex items-center justify-center gap-3 bg-background border border-border py-3.5 px-4 rounded-xl font-medium text-sm hover:bg-foreground/5 hover:border-primary/40 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isGoogleLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-foreground/20 border-t-primary rounded-full animate-spin flex-shrink-0" />
                  <span>Redirecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-foreground/40 uppercase tracking-widest font-medium">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm outline-none"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm outline-none"
                    placeholder="Your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="email-signin-btn"
                disabled={isLoading || !email || !password}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-sm text-foreground/60">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-foreground/30 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
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