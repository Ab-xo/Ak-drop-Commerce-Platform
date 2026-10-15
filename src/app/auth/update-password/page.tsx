'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      toast.error('Use 10+ characters with uppercase, lowercase, a number, and a special character.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        toast.error('Unable to update your password. Please request a new link.');
        return;
      }
      toast.success('Password updated successfully.');
      router.replace('/auth/signin');
    } catch {
      toast.error('Unable to update your password. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  }

  return <main className="min-h-screen flex items-center justify-center bg-background px-6 py-24"><div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden"><div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" /><div className="p-8"><h1 className="text-3xl font-black uppercase italic tracking-tight">New <span className="text-primary">password</span></h1><p className="mt-2 text-sm text-muted-foreground">Choose a strong password for your AK Drop account.</p><form onSubmit={handleSubmit} className="mt-8 space-y-5"><label className="block text-sm font-semibold" htmlFor="password">New password</label><input id="password" type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" /><label className="block text-sm font-semibold" htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" type="password" required minLength={10} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" /><p className="text-xs text-muted-foreground">Minimum 10 characters, including uppercase, lowercase, a number, and a special character.</p><button disabled={isLoading} className="w-full rounded-xl bg-primary px-4 py-3 font-black text-primary-foreground disabled:opacity-50">{isLoading ? 'Updating…' : 'Update password'}</button><Link href="/auth/signin" className="block text-center text-sm text-primary hover:underline">Back to sign in</Link></form></div></div></main>;
}
