'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { requestPasswordReset } from '@/lib/auth-actions';
import { toast } from 'sonner';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') === '/admin/login' ? '/admin/login' : '/auth/signin';
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  async function handleSubmit(formData: FormData) {
    formData.set('next', next);
    setIsLoading(true);
    try {
      const result = await requestPasswordReset(formData);
      if (result?.error) toast.error(result.error);
      else { setSent(true); toast.success('If an account exists, a reset link is on its way.'); }
    } catch { toast.error('Could not contact Supabase Auth. Check your Supabase URL/key and network connection, then try again.'); }
    finally { setIsLoading(false); }
  }
  const returnHref = next === '/admin/login' ? '/admin/login' : '/auth/signin';
  const returnLabel = next === '/admin/login' ? 'Return to admin sign in' : 'Return to sign in';

  return <main className="min-h-screen flex items-center justify-center bg-background px-6 py-24"><div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden"><div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" /><div className="p-8"><h1 className="text-3xl font-black uppercase italic tracking-tight">Reset <span className="text-primary">password</span></h1><p className="mt-2 text-sm text-muted-foreground">Enter your email and we’ll send a secure recovery link.</p>{sent ? <div className="mt-8 space-y-4"><p className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">If an account exists for that address, check its inbox and spam folder. Reset links expire for your security. If no email arrives, verify the address and check your Supabase Auth email-provider configuration.</p><Link href={returnHref} className="text-primary font-bold hover:underline">{returnLabel}</Link></div> : <form action={handleSubmit} className="mt-8 space-y-5"><label className="block text-sm font-semibold" htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" /><button disabled={isLoading} className="w-full rounded-xl bg-primary px-4 py-3 font-black text-primary-foreground disabled:opacity-50">{isLoading ? 'Sending…' : 'Send reset link'}</button><Link href={returnHref} className="block text-center text-sm text-primary hover:underline">{returnLabel}</Link></form>}</div></div></main>;
}

export default function ForgotPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-background" />}><ForgotPasswordForm /></Suspense>;
}
