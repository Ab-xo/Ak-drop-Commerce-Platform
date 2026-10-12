'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, UserCheck, ArrowRight } from 'lucide-react';
import { signUp } from '@/lib/auth-actions';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    if (password !== confirmPassword) { toast.error("Passwords don't match."); return; }
    setIsLoading(true);
    try {
      const result = await signUp(formData);
      if (result?.error) toast.error(result.error);
      else toast.success('Account created! Check your email to verify.');
    } catch { toast.error('An unexpected error occurred. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) { toast.error(error.message || 'Failed to sign up with Google.'); setIsGoogleLoading(false); }
    } catch { toast.error('Failed to sign up with Google. Please try again.'); setIsGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex pt-20">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"><Image src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=90&w=1400" alt="AK Drop streetwear collection" fill priority sizes="50vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" /><div className="relative z-10 flex flex-col justify-between h-full p-12"><div /><div className="space-y-6"><div className="w-12 h-1 bg-primary rounded-full" /><h2 className="text-4xl md:text-5xl font-black italic uppercase text-white leading-tight">JOIN THE<br /><span className="text-primary">DROP</span></h2><p className="text-white/70 text-lg font-medium max-w-xs">Create your free account and get access to exclusive drops, ETB pricing, and fast Addis delivery.</p><Link href="/shop" className="inline-flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest hover:gap-4 transition-all">Browse the catalog <ArrowRight size={16} /></Link></div><p className="text-white/30 text-xs font-bold uppercase tracking-widest">AK Drop — Addis Ababa, Ethiopia</p></div></div>
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-6 py-12 overflow-y-auto"><motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md"><div className="mb-8"><h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Create <span className="text-primary">Account</span></h1><p className="text-foreground/50 text-sm">Join AK Drop — free, fast, and built for Addis style.</p></div><div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden"><div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" /><div className="p-8 space-y-6"><button type="button" onClick={handleGoogleSignUp} disabled={isGoogleLoading} className="w-full flex items-center justify-center gap-3 bg-background border border-border py-3.5 px-4 rounded-xl font-medium text-sm hover:bg-foreground/5 hover:border-primary/40 transition-all disabled:opacity-60">{isGoogleLoading ? 'Redirecting to Google…' : 'Continue with Google'}</button><div className="flex items-center gap-4"><div className="flex-1 h-px bg-border" /><span className="text-[11px] text-foreground/40 uppercase tracking-widest">or</span><div className="flex-1 h-px bg-border" /></div><form action={handleSubmit} className="space-y-4"><div className="space-y-1.5"><label htmlFor="fullName" className="text-sm font-semibold">Full name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} /><input id="fullName" name="fullName" type="text" required minLength={2} maxLength={80} autoComplete="name" placeholder="Your full name" className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none" /></div></div><div className="space-y-1.5"><label htmlFor="email" className="text-sm font-semibold">Email address</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} /><input id="email" name="email" type="email" required autoComplete="email" placeholder="your@email.com" className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none" /></div></div><div className="space-y-1.5"><label htmlFor="username" className="text-sm font-semibold">Username</label><div className="relative"><UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} /><input id="username" name="username" type="text" required minLength={3} maxLength={16} pattern="[A-Za-z0-9_]+" autoComplete="username" placeholder="Choose a username" className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none" /></div></div><div className="space-y-1.5"><label htmlFor="password" className="text-sm font-semibold">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} /><input id="password" name="password" type={showPassword ? 'text' : 'password'} required minLength={10} autoComplete="new-password" placeholder="At least 10 characters" className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 p-1">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><p className="text-[11px] text-muted-foreground">Use uppercase, lowercase, a number, and a special character.</p></div><div className="space-y-1.5"><label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} /><input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required minLength={10} autoComplete="new-password" placeholder="Repeat your password" className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm outline-none" /><button type="button" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 p-1">{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div><button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-black text-sm uppercase italic tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? 'Creating account…' : 'Create Account'}</button></form><p className="text-center text-sm text-foreground/50">Already have an account? <Link href="/auth/signin" className="text-primary hover:underline font-bold">Sign in</Link></p></div></div><p className="text-center text-xs text-foreground/30 mt-6">By creating an account, you agree to AK Drop&apos;s Terms &amp; Privacy Policy.</p></motion.div></div>
    </div>
  );
}
