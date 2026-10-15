'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User, UserRound } from 'lucide-react';
import AuthPageShell from '@/components/auth/AuthPageShell';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { signUp } from '@/lib/auth-actions';
import { toast } from 'sonner';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(formData);
      if (result?.error) toast.error(result.error);
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthPageShell isLongForm>
      <header className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Join the community
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Create account
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          It only takes a minute to get started.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/5 sm:p-7">
        <GoogleAuthButton />

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            or use email
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={handleSubmit} className="space-y-3.5">
          <AuthInput
            id="fullName"
            name="fullName"
            label="Full name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            icon={<User size={17} />}
            required
            minLength={2}
            maxLength={80}
          />
          <AuthInput
            id="email"
            name="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail size={17} />}
            required
          />
          <AuthInput
            id="username"
            name="username"
            label="Username"
            type="text"
            placeholder="Choose a username"
            autoComplete="username"
            icon={<UserRound size={17} />}
            required
            minLength={3}
            maxLength={16}
            pattern="[A-Za-z0-9_]+"
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="At least 10 characters"
            visible={showPassword}
            onToggle={() => setShowPassword((visible) => !visible)}
          />
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your password"
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((visible) => !visible)}
          />
          <p className="-mt-1 text-xs leading-5 text-muted-foreground">
            Use 10+ characters with uppercase, lowercase, a number, and a symbol.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="font-bold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
        By creating an account, you agree to AK Drop&apos;s Terms and Privacy Policy.
      </p>
    </AuthPageShell>
  );
}

type AuthInputProps = {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  icon: React.ReactNode;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

function AuthInput({
  id,
  name,
  label,
  type,
  placeholder,
  autoComplete,
  icon,
  required,
  minLength,
  maxLength,
  pattern,
}: AuthInputProps) {
  return (
    <label htmlFor={id} className="block space-y-1.5 text-sm font-semibold">
      {label}
      <span className="relative block">
        <span
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </span>
    </label>
  );
}

type PasswordInputProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
};

function PasswordInput({
  id,
  name,
  label,
  placeholder,
  visible,
  onToggle,
}: PasswordInputProps) {
  return (
    <label htmlFor={id} className="block space-y-1.5 text-sm font-semibold">
      {label}
      <span className="relative block">
        <Lock
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={17}
        />
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          minLength={10}
          autoComplete="new-password"
          placeholder={placeholder}
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}
