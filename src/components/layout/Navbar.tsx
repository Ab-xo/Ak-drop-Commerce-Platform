"use client";

import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ClientOnly from "@/components/ui/ClientOnly";
import UserProfileDropdown from "./UserProfileDropdown";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<{
        email: string;
        name?: string;
        avatarUrl?: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const totalItems = useCartStore((state) => state.getTotalItems());
    const setCartOpen = useCartStore((state) => state.setCartOpen);

    useEffect(() => {
        let mounted = true;
        const supabase = createClient();

        const fetchUserProfile = async (authUser: SupabaseUser) => {
            try {
                const { data: profile } = await supabase
                    .from("user_profiles")
                    .select("full_name, avatar_url")
                    .eq("user_id", authUser.id)
                    .single();

                if (mounted) {
                    setUser({
                        email: authUser.email!,
                        name:
                            profile?.full_name ||
                            authUser.user_metadata?.full_name ||
                            authUser.user_metadata?.name ||
                            undefined,
                        avatarUrl:
                            profile?.avatar_url ||
                            authUser.user_metadata?.avatar_url ||
                            undefined,
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (mounted) {
                    setUser({
                        email: authUser.email!,
                        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || undefined,
                        avatarUrl: authUser.user_metadata?.avatar_url || undefined,
                    });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchUserProfile(session.user);
            } else {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
            }
        }).catch(() => {
            if (mounted) setLoading(false);
        });

        // Listen for auth state changes (login/logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    setLoading(true); // show loading briefly while fetching new profile
                    fetchUserProfile(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
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
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        { name: "Categories", href: "/categories" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <motion.nav
            initial={false}
            animate={{
                backgroundColor: isScrolled
                    ? "var(--nav-bg, hsla(var(--background) / 0.95))"
                    : "transparent",
                backdropFilter: isScrolled ? "blur(16px)" : "blur(0px)",
                borderColor: isScrolled
                    ? "hsla(var(--border) / 1)"
                    : "transparent",
                paddingTop: isScrolled ? "0.6rem" : "1.5rem",
                paddingBottom: isScrolled ? "0.6rem" : "1.5rem",
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed top-0 w-full z-50 border-b"
            style={
                {
                    // @ts-expect-error - Custom CSS property
                    "--nav-bg": isScrolled
                        ? "hsla(var(--background) / 0.95)"
                        : "transparent",
                } as React.CSSProperties
            }
        >
            {/* 
                IMPORTANT: overflow must NOT be hidden/clip on this container 
                otherwise the UserProfileDropdown will be clipped 
            */}
            <div className="container mx-auto px-4 md:px-8 flex items-center justify-between" style={{ overflow: 'visible' }}>
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center hover:opacity-80 transition-opacity group"
                >
                    <div className="flex items-center">
                        <div className="relative">
                            <span className="text-3xl font-black tracking-tight text-foreground">
                                A
                            </span>
                            <span className="text-3xl font-black tracking-tight text-foreground relative">
                                K
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary transform rotate-45" />
                            </span>
                        </div>
                        <div className="w-px h-6 bg-border mx-3" />
                        <span className="text-xl font-semibold tracking-wide text-foreground/90 uppercase">
                            ECOMM
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm hover:text-primary transition-colors text-foreground nav-link"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Icons */}
                <div className="flex items-center space-x-5" style={{ overflow: 'visible' }}>
                    <ClientOnly>
                        <ThemeToggle />
                    </ClientOnly>
                    <button className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
                        <Search size={20} />
                    </button>
                    <button
                        onClick={() => setCartOpen(true)}
                        className="p-2 hover:bg-foreground/10 rounded-full transition-colors relative"
                    >
                        <ShoppingCart size={20} />
                        <ClientOnly>
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                                    {totalItems}
                                </span>
                            )}
                        </ClientOnly>
                    </button>
                    <ClientOnly>
                        {loading ? (
                            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                        ) : user ? (
                            <UserProfileDropdown user={user} />
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
                            >
                                <User size={20} />
                            </Link>
                        )}
                    </ClientOnly>
                    <button
                        className="md:hidden p-2 hover:bg-foreground/10 rounded-full transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border overflow-hidden relative z-50"
                    >
                        <div className="flex flex-col p-6 space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-lg hover:text-primary transition-colors border-b border-border/50 nav-link w-fit"
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
};

export default Navbar;
