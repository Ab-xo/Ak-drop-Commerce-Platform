"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Package, LogOut, ChevronRight, Shield, Star, Bell } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

interface UserProfileDropdownProps { user: { email: string; name?: string; avatarUrl?: string; }; }

const UserProfileDropdown = memo(({ user }: UserProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const updatedProfile = (event as CustomEvent<{ full_name?: string; avatar_url?: string }>).detail;
      setCurrentUser((prev) => ({ ...prev, name: updatedProfile.full_name || prev.name, avatarUrl: updatedProfile.avatar_url || prev.avatarUrl }));
      setImageError(false);
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const handleSignOut = useCallback(async () => {
    closeDropdown();
    const { error } = await createClient().auth.signOut();
    if (error) { toast.error("Failed to sign out"); return; }
    toast.success("Signed out successfully");
    window.location.assign("/");
  }, [closeDropdown]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) closeDropdown(); };
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeDropdown(); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.removeEventListener("keydown", handleKeyDown); };
  }, [isOpen, closeDropdown]);

  const getInitials = () => {
    const name = currentUser.name?.trim();
    if (!name) return currentUser.email.slice(0, 1).toUpperCase();
    const parts = name.split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
  };
  const displayName = currentUser.name || currentUser.email.split("@")[0];
  const menuGroups = [
    { label: "Account", items: [
      { icon: User, label: "Edit Profile", description: "Update your personal info", href: "/account?tab=profile", color: "text-blue-400", bgColor: "bg-blue-500/10 group-hover:bg-blue-500/20" },
      { icon: Package, label: "My Orders", description: "Track and view orders", href: "/account?tab=orders", color: "text-green-400", bgColor: "bg-green-500/10 group-hover:bg-green-500/20" },
      { icon: Bell, label: "Notifications", description: "Manage alerts & updates", href: "/account?tab=notifications", color: "text-orange-400", bgColor: "bg-orange-500/10 group-hover:bg-orange-500/20" },
    ] },
    { label: "Preferences", items: [{ icon: Settings, label: "Settings & Privacy", description: "Security & preferences", href: "/account?tab=settings", color: "text-purple-400", bgColor: "bg-purple-500/10 group-hover:bg-purple-500/20" }] },
  ];

  return <div className="relative isolate" ref={dropdownRef}>
    <button onClick={() => setIsOpen((open) => !open)} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background shadow-lg" aria-label={`Open account menu for ${displayName}`} aria-expanded={isOpen} aria-haspopup="menu" type="button">
      {currentUser.avatarUrl && !imageError ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" onError={() => setImageError(true)} loading="lazy" /> : getInitials()}
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-background" aria-label="Online" />
    </button>
    <AnimatePresence>
      {isOpen && <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.16, ease: "easeOut" }} className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border/80 bg-background shadow-[0_20px_50px_-18px_hsl(var(--foreground)/0.35)] z-[100]" role="menu">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
        <div className="border-b border-border/70 bg-background px-5 pb-4 pt-5"><div className="flex items-center gap-4"><div className="relative shrink-0"><div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg ring-1 ring-border/50">{currentUser.avatarUrl && !imageError ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" onError={() => setImageError(true)} /> : getInitials()}</div><span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-background" /></div><div className="min-w-0"><div className="flex items-center gap-1.5"><h3 className="font-semibold text-sm truncate">{displayName}</h3><Shield size={12} className="text-primary shrink-0" /></div><p className="text-xs text-muted-foreground truncate">{currentUser.email}</p><div className="flex items-center gap-1 mt-1.5"><Star size={10} className="text-yellow-400 fill-yellow-400" /><span className="text-[10px] text-muted-foreground font-medium">AK Drop member</span></div></div></div></div>
        <div className="bg-background px-2 pb-2 pt-2 space-y-1">{menuGroups.map((group) => <div key={group.label}><p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{group.label}</p>{group.items.map((item) => <Link key={item.label} href={item.href} onClick={closeDropdown} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition-all group" role="menuitem"><div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bgColor}`}><item.icon size={15} className={item.color} /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium leading-none">{item.label}</p><p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p></div><ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-all" /></Link>)}</div>)}</div>
        <div className="mx-4 border-t border-border/70" /><div className="bg-background p-2"><button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all group" role="menuitem"><div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><LogOut size={15} className="text-red-400" /></div><div className="flex-1 text-left"><p className="text-sm font-medium group-hover:text-red-500">Sign Out</p><p className="text-[11px] text-muted-foreground">See you next time!</p></div></button></div>
      </motion.div>}
    </AnimatePresence>
  </div>;
});

UserProfileDropdown.displayName = "UserProfileDropdown";
export default UserProfileDropdown;
