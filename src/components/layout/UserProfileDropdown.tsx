"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Package,
  LogOut,
  ChevronRight,
  Shield,
  Star,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

interface UserProfileDropdownProps {
  user: {
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

const UserProfileDropdown = memo(({ user }: UserProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedProfile = event.detail;
      setCurrentUser(prev => ({
        ...prev,
        name: updatedProfile.full_name,
        avatarUrl: updatedProfile.avatar_url,
      }));
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  // Memoize handlers
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    closeDropdown();
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error("Failed to sign out");
        return;
      }
      
      toast.success("Signed out successfully");
      
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
      
    } catch (error) {
      toast.error("Failed to sign out");
    }
  }, [closeDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDropdown();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  // Memoize display values
  const getInitials = useCallback((): string => {
    const name = currentUser.name?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return currentUser.email.charAt(0).toUpperCase();
  }, [currentUser.name, currentUser.email]);

  const displayName = currentUser.name || currentUser.email.split("@")[0];

  const menuGroups = [
    {
      label: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          description: "Update your personal info",
          href: "/account?tab=profile",
          color: "text-blue-400",
          bgColor: "bg-blue-500/10 group-hover:bg-blue-500/20",
        },
        {
          icon: Package,
          label: "My Orders",
          description: "Track and view orders",
          href: "/account?tab=orders",
          color: "text-green-400",
          bgColor: "bg-green-500/10 group-hover:bg-green-500/20",
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage alerts & updates",
          href: "/account?tab=notifications",
          color: "text-orange-400",
          bgColor: "bg-orange-500/10 group-hover:bg-orange-500/20",
        },
      ],
    },
    {
      label: "Preferences",
      items: [
        {
          icon: Settings,
          label: "Settings & Privacy",
          description: "Security & preferences",
          href: "/account?tab=settings",
          color: "text-purple-400",
          bgColor: "bg-purple-500/10 group-hover:bg-purple-500/20",
        },
      ],
    },
  ];

  return (
    <div className="relative" ref={dropdownRef} style={{ zIndex: 9999 }}>
      {/* Avatar Trigger Button */}
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background shadow-lg cursor-pointer"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        {currentUser.avatarUrl && !imageError ? (
          <img
            src={currentUser.avatarUrl}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          getInitials()
        )}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-background" />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-3 w-80 rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
              border: "1px solid hsl(var(--border))",
              boxShadow:
                "0 24px 48px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
              zIndex: 9999,
            }}
          >
            {/* Profile Header */}
            <div className="relative overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500" />

              <div className="p-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {currentUser.avatarUrl && !imageError ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={displayName}
                          className="w-full h-full rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        getInitials()
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-background" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-semibold text-foreground text-sm truncate">
                        {displayName}
                      </h3>
                      <Shield size={12} className="text-primary flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentUser.email}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Premium Member
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Groups */}
            <div className="px-2 pb-2 space-y-1">
              {menuGroups.map((group, gi) => (
                <div key={gi}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {group.label}
                  </p>
                  {group.items.map((item, ii) => (
                    <Link
                      key={ii}
                      href={item.href}
                      onClick={closeDropdown}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition-all duration-150 group cursor-pointer"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${item.bgColor}`}
                      >
                        <item.icon
                          size={15}
                          className={`${item.color} transition-colors`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-none">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      />
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-border/50" />

            {/* Sign Out */}
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all duration-150 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors flex-shrink-0">
                  <LogOut
                    size={15}
                    className="text-red-400 group-hover:text-red-500 transition-colors"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground group-hover:text-red-500 transition-colors leading-none">
                    Sign Out
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    See you next time!
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

UserProfileDropdown.displayName = 'UserProfileDropdown';

export default UserProfileDropdown;