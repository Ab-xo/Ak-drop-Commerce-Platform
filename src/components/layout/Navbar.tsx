"use client";

import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { ShoppingCart, User, Search, Menu, X, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ClientOnly from "@/components/ui/ClientOnly";
import UserProfileDropdown from "./UserProfileDropdown";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavUser {
  email: string;
  name?: string;
  avatarUrl?: string;
}

/** Extract the best available display name from a Supabase auth user */
function resolveDisplayName(authUser: SupabaseUser, profileName?: string | null): string | undefined {
  // Priority: DB profile → Google full_name → Google name → email prefix
  return (
    profileName ||
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    undefined
  );
}

/** Extract the best available avatar from a Supabase auth user */
function resolveAvatarUrl(authUser: SupabaseUser, profileAvatar?: string | null): string | undefined {
  return profileAvatar || authUser.user_metadata?.avatar_url || undefined;
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);

  const totalItems = useCartStore((s) => s.getTotalItems());
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const loadUser = async (authUser: SupabaseUser) => {
      try {
        // Try both id and user_id column names to handle schema variations
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, avatar_url")
          .or(`id.eq.${authUser.id},user_id.eq.${authUser.id}`)
          .maybeSingle();

        if (mounted) {
          setUser({
            email: authUser.email ?? "",
            name: resolveDisplayName(authUser, profile?.full_name),
            avatarUrl: resolveAvatarUrl(authUser, profile?.avatar_url),
          });
          setLoading(false);
        }
      } catch {
        // Even if DB query fails, show user from OAuth metadata
        if (mounted) {
          setUser({
            email: authUser.email ?? "",
            name: resolveDisplayName(authUser),
            avatarUrl: resolveAvatarUrl(authUser),
          });
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user);
      } else {
        if (mounted) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user);
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Home",       href: "/" },
    { name: "Shop",       href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "About",      href: "/about" },
    { name: "Contact",    href: "/contact" },
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        backgroundColor: isScrolled ? "hsla(var(--background) / .95)" : "transparent",
        backdropFilter: isScrolled ? "blur(16px)" : "blur(0px)",
        borderColor: isScrolled ? "hsla(var(--border) / 1)" : "transparent",
      }}
      className="fixed top-0 w-full z-50 border-b"
    >
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" aria-label="AK Drop home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg rotate-[-8deg] group-hover:rotate-0 transition-transform">
            AK
          </span>
          <span className="text-xl font-black tracking-[.18em] uppercase">DROP</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-sm hover:text-primary nav-link">
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <span className="hidden xl:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground/50">
            <MapPin size={13} /> Addis delivery
          </span>

          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>

          <Link href="/shop" aria-label="Search products" className="p-2 hover:bg-foreground/10 rounded-full">
            <Search size={19} />
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping bag"
            className="p-2 hover:bg-foreground/10 rounded-full relative"
          >
            <ShoppingCart size={19} />
            <ClientOnly>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {totalItems}
                </span>
              )}
            </ClientOnly>
          </button>

          {/* Profile / Sign-in */}
          <ClientOnly>
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <UserProfileDropdown user={user} />
            ) : (
              <Link href="/auth/signin" aria-label="Sign in" className="p-2 hover:bg-foreground/10 rounded-full">
                <User size={19} />
              </Link>
            )}
          </ClientOnly>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-lg border-b border-border/50 pb-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
