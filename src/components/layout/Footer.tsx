"use client";

import Link from "next/link";
import { Instagram, Facebook, Phone, MapPin, ArrowUpRight } from "lucide-react";

const shopLinks = [
  { label: "All products",       href: "/shop" },
  { label: "Shoes",              href: "/shop?category=shoes" },
  { label: "Shirts & apparel",   href: "/shop?category=clothing" },
  { label: "Accessories",        href: "/shop?category=accessories" },
];

const supportLinks = [
  { label: "About AK Drop",   href: "/about" },
  { label: "Contact us",      href: "/contact" },
  { label: "Shopping bag",    href: "/cart" },
  { label: "WhatsApp support", href: "https://wa.me/251902377627", external: true },
];

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const cls =
    "group flex items-center gap-1 text-foreground/60 hover:text-primary transition-colors duration-200 w-fit";

  const inner = (
    <>
      <span className="relative">
        {label}
        {/* sliding underline */}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
      </span>
      <ArrowUpRight
        size={13}
        className="opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
      />
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div>
            <Link
              href="/"
              className="group flex items-center gap-3 mb-6 w-fit"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300">
                AK
              </span>
              <span className="text-xl font-black tracking-[.18em] uppercase group-hover:text-primary transition-colors duration-200">
                DROP
              </span>
            </Link>
            <p className="text-foreground/70 text-sm leading-relaxed mb-6">
              Curated footwear, apparel, and everyday style for Addis and beyond.
              Shop confidently from a modern Ethiopian storefront.
            </p>
            <div className="flex gap-3">
              <Link
                href="#"
                aria-label="Instagram"
                className="p-2 bg-foreground/5 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-200"
              >
                <Instagram size={17} />
              </Link>
              <Link
                href="#"
                aria-label="Facebook"
                className="p-2 bg-foreground/5 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-200"
              >
                <Facebook size={17} />
              </Link>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Shop</h4>
            <ul className="space-y-4 text-sm">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Support</h4>
            <ul className="space-y-4 text-sm">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} external={l.external} />
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">
              Addis delivery
            </h4>
            <p className="text-foreground/70 text-sm leading-relaxed mb-5">
              Questions about fit, delivery, or availability? Our team is ready to help.
            </p>
            <div className="space-y-3 text-sm text-foreground/70">
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-primary shrink-0" />
                Addis Ababa, Ethiopia
              </p>
              <a
                href="tel:+251902377627"
                className="group flex items-center gap-2 hover:text-primary transition-colors duration-200 w-fit"
              >
                <Phone size={16} className="text-primary shrink-0" />
                <span className="relative">
                  +251 902 377 627
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between text-xs text-foreground/40">
          <p>© {year} AK Drop. All rights reserved.</p>
          <p className="mt-3 md:mt-0">Prices shown in Ethiopian Birr (ETB)</p>
        </div>
      </div>
    </footer>
  );
}
