'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

function safeRedirect(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const urlError = searchParams.get('error');
  const redirectTo = safeRedirect(searchParams.get('redirect'));

  useEffect(() => { if (urlError) toast.error(urlError); }, [urlError]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) toast.error('Invalid email or password. Please try again.');
      else { toast.success('Welcome back to AK Drop!'); router.replace(redirectTo); router.refresh(); }
    } catch { toast.error('An unexpected error occurred. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`, queryParams: { access_type: 'offline', prompt: 'consent' } } });
      if (error) { toast.error(error.message || 'Failed to sign in with Google.'); setIsGoogleLoading(false); }
    } catch { toast.error('Failed to connect to Google. Please try again.'); setIsGoogleLoading(false); }
  };

  return <div className="min-h-screen flex pt-20"><div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"><Image src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=90&w=1400" alt="AK Drop premium footwear" fill priority sizes="50vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" /><div className="relative z-10 flex flex-col justify-between h-full p-12"><div /><div className="space-y-6"><div className="w-12 h-1 bg-primary rounded-full" /><h2 className="text-4xl md:text-5xl font-black italic uppercase text-white leading-tight">STYLE THAT<br /><span className="text-primary">MOVES YOU</span></h2><p className="text-white/70 text-lg font-medium max-w-xs">Premium footwear, apparel &amp; accessories — curated for Addis Ababa and beyond.</p><Link href="/shop" className="inline-flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest hover:gap-4 transition-all">Explore the drop <ArrowRight size={16} /></Link></div><p className="text-white/30 text-xs font-bold uppercase tracking-widest">AK Drop — Addis Ababa, Ethiopia</p></div></div><div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-6 py-12 overflow-y-auto"><motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md"><div className="mb-8"><h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Welcome <span className="text-primary">Back</span></h1><p className="text-foreground/50 text-sm">Sign in to your AK Drop account to continue.</p></div><AnimatePresence>{urlError && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-start gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{urlError}</span></motion.div>}</AnimatePresence><div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden"><div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" /><div className="p-8 space-y-6"><button type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="w-full flex items-center justify-center gap-3 bg-background border border-border py-3.5 px-4 rounded-xl font-medium text-sm hover:bg-foreground/5 hover:border-primary/40 transition-all disabled:opacity-60">{isGoogleLoading ? 'Redirecting to Google…' : 'Continue with Google'}</button><div className="flex items-center gap-4"><div className="flex-1 h-px bg-border" /><span className="text-[11px] text-foreground/40 uppercase tracking-widest">or</span><div className="flex-1 h-px bg-border" /></div><form onSubmit={handleEmailSignIn} className="space-y-4"><div className="space-y-1.5"><label htmlFor="email" className="text-sm font-semibold">Email address</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} /><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none" /></div></div><div className="space-y-1.5"><label htmlFor="password" className="text-sm font-semibold">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} /><input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 p-1">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div><div className="flex justify-end"><Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link></div><button type="submit" disabled={isLoading || !email.trim() || !password} className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-black text-sm uppercase italic tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? 'Signing in…' : <><Sparkles size={15} />Sign In</>}</button></form><p className="text-center text-sm text-foreground/50">No account yet? <Link href="/auth/signup" className="text-primary hover:underline font-bold">Create one free</Link></p></div></div><p className="text-center text-xs text-foreground/30 mt-6">By continuing, you agree to AK Drop&apos;s Terms &amp; Privacy Policy.</p></motion.div></div></div>;
}

export default function SignInPage() { return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}><SignInForm /></Suspense>; }
