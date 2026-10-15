"use client";

import { FormEvent, useState } from "react";
import { Mail, Send } from "lucide-react";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

export default function ContactPage() {
  const [prepared, setPrepared] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supportEmail) return;

    const form = new FormData(event.currentTarget);
    const subject = `AK Drop inquiry: ${String(form.get("name") ?? "").trim()}`;
    const body = [
      `Name: ${String(form.get("name") ?? "").trim()}`,
      `Email: ${String(form.get("email") ?? "").trim()}`,
      "",
      String(form.get("message") ?? "").trim(),
    ].join("\n");
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  };

  return (
    <main className="min-h-screen py-32">
      <div className="container mx-auto px-4 md:px-8">
        <header className="mb-16 max-w-3xl">
          <p className="mb-5 text-xs font-black uppercase tracking-[.25em] text-primary">
            Contact
          </p>
          <h1 className="mb-6 text-5xl font-black uppercase italic tracking-tighter md:text-8xl">
            LET&apos;S <span className="text-primary">CONNECT</span>
          </h1>
          <p className="text-lg text-foreground/60">
            Questions about the AK Drop commerce portfolio? Use the configurable
            support contact below.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <section className="glass-card space-y-6">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-primary/10 p-3 text-primary"><Mail size={20} /></span>
              <div>
                <h2 className="text-2xl font-black uppercase italic">Support contact</h2>
                {supportEmail ? (
                  <a href={`mailto:${supportEmail}`} className="mt-2 inline-block text-foreground/70 hover:text-primary">
                    {supportEmail}
                  </a>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                    No support address is configured for this portfolio demo.
                    Set <code>NEXT_PUBLIC_SUPPORT_EMAIL</code> to enable email contact.
                  </p>
                )}
              </div>
            </div>
            <p className="border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
              This demo does not store contact submissions. When a support email
              is configured, the form opens the visitor&apos;s email application.
            </p>
          </section>

          <form onSubmit={submit} className="glass-card space-y-6">
            <div>
              <h2 className="mb-3 text-3xl font-black uppercase italic">Send a message</h2>
              <p className="text-sm text-foreground/60">Complete the details and your email app will prepare a message.</p>
            </div>
            <label className="block text-sm font-bold">
              Name
              <input name="name" required autoComplete="name" className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3" />
            </label>
            <label className="block text-sm font-bold">
              Email
              <input type="email" name="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3" />
            </label>
            <label className="block text-sm font-bold">
              Message
              <textarea name="message" required rows={6} className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3" />
            </label>
            <button
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={!supportEmail}
            >
              <Send size={17} /> {supportEmail ? "Open email app" : "Email contact unavailable"}
            </button>
            {prepared && <p role="status" className="text-sm font-bold text-primary">Your email app should open with the message ready to send.</p>}
          </form>
        </div>
      </div>
    </main>
  );
}
