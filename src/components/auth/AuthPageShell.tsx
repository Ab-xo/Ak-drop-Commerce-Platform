import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type AuthPageShellProps = {
  children: ReactNode;
  isLongForm?: boolean;
};

export default function AuthPageShell({
  children,
  isLongForm = false,
}: AuthPageShellProps) {
  return (
    <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute -bottom-48 right-[-8rem] h-80 w-80 rounded-full bg-primary/[0.05] blur-3xl" />
      </div>

      <header className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="AK Drop home"
          className="group inline-flex items-center gap-2.5"
        >
          <span className="flex size-9 -rotate-6 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground transition-transform group-hover:rotate-0">
            AK
          </span>
          <span className="text-sm font-black tracking-[0.2em]">DROP</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to home</span>
        </Link>
      </header>

      <div
        className={`relative flex flex-1 justify-center px-4 sm:px-6 ${
          isLongForm ? 'items-start py-5 sm:py-8' : 'items-center py-8 sm:py-12'
        }`}
      >
        <div
          className={`my-auto w-full ${
            isLongForm ? 'max-w-[30rem]' : 'max-w-[27rem]'
          }`}
        >
          {children}
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 border-t border-border/70 px-5 py-4 text-[11px] text-muted-foreground sm:flex-row sm:px-8">
        <p>© {new Date().getFullYear()} AK Drop. All rights reserved.</p>
        <nav aria-label="Legal and support" className="flex items-center gap-3">
          <span>Terms of service</span>
          <span aria-hidden="true" className="text-border">·</span>
          <span>Privacy</span>
          <span aria-hidden="true" className="text-border">·</span>
          <Link href="/contact" className="transition hover:text-foreground">
            Help
          </Link>
        </nav>
      </footer>
    </section>
  );
}
