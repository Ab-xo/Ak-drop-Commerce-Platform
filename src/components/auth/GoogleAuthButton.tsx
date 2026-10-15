'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

type GoogleAuthButtonProps = {
  redirectTo?: string;
};

export default function GoogleAuthButton({
  redirectTo = '/',
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleAuth() {
    setIsLoading(true);
    try {
      const next =
        redirectTo.startsWith('/') && !redirectTo.startsWith('//')
          ? redirectTo
          : '/';
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', next);

      const { error } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback.toString() },
      });

      if (error) {
        toast.error(error.message || 'Unable to connect to Google.');
        setIsLoading(false);
      }
    } catch {
      toast.error('Unable to connect to Google. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white px-4 py-3 text-sm font-medium text-[#3c4043] shadow-sm transition-colors hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
    >
      <GoogleMark />
      {isLoading ? 'Connecting to Google…' : 'Continue with Google'}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-5 w-5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
      />
    </svg>
  );
}
