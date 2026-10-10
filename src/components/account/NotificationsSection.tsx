"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Package,
  Tag,
  Settings,
  Check,
  Trash2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface Notification {
  id: string;
  type: "order" | "promo" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  image?: string;
}

// Mock notifications data with images
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "Order Shipped! 🚀",
    message: "Your Nike Air Max 2024 is on the way and will arrive in 2-3 days.",
    timestamp: "2 hours ago",
    read: false,
    image: "/img/pexels-photo-2529148.webp",
  },
  {
    id: "2",
    type: "promo",
    title: "Flash Sale Alert! ⚡",
    message: "Get 30% off on all sneakers. Limited time offer ends tonight!",
    timestamp: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "order",
    title: "Order Delivered Successfully ✓",
    message: "Your recent order has been delivered. Rate your experience!",
    timestamp: "1 day ago",
    read: true,
    image: "/img/photo-1542291026-7eec264c27ff.avif",
  },
  {
    id: "4",
    type: "system",
    title: "Profile Update Complete",
    message: "Your account information has been updated successfully.",
    timestamp: "3 days ago",
    read: true,
  },
  {
    id: "5",
    type: "promo",
    title: "New Collection Dropped! 🔥",
    message: "Check out the latest arrivals in our summer collection.",
    timestamp: "5 days ago",
    read: false,
  },
];

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    return !notification.read;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return Package;
      case "promo":
        return Tag;
      case "system":
        return Settings;
      default:
        return Bell;
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case "order":
        return "from-blue-500/20 via-blue-500/10 to-transparent";
      case "promo":
        return "from-green-500/20 via-green-500/10 to-transparent";
      case "system":
        return "from-purple-500/20 via-purple-500/10 to-transparent";
      default:
        return "from-muted";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "order":
        return "text-blue-400 bg-blue-500/10";
      case "promo":
        return "text-green-400 bg-green-500/10";
      case "system":
        return "text-purple-400 bg-purple-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Bell size={24} className="text-primary" />
            </div>
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground mt-2 ml-12">
            {unreadCount > 0 ? (
              <>
                You have <span className="font-semibold text-primary">{unreadCount} unread</span> notifications
              </>
            ) : (
              "You're all caught up! ✨"
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-medium text-sm"
          >
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "All", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              filter === f.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {f.label}
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${
                filter === f.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-foreground"
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications Timeline */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-20 glass-card"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                All Clear!
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? "No notifications yet"
                  : "No unread notifications"}
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => {
              const Icon = getIcon(notification.type);
              const gradient = getGradient(notification.type);
              const iconColor = getIconColor(notification.type);

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative overflow-hidden rounded-2xl transition-all group ${
                    notification.read
                      ? "bg-secondary/30 border border-border/50"
                      : "glass-card shadow-lg border-primary/20"
                  }`}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-50`} />

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}

                  <div className="relative flex items-start gap-4 p-5">
                    {/* Icon or Image */}
                    {notification.image ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                        <img
                          src={notification.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`p-3.5 rounded-xl ${iconColor} flex-shrink-0`}>
                        <Icon size={22} />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold mb-1.5 ${
                          notification.read
                            ? "text-foreground/70"
                            : "text-foreground"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed mb-2 ${
                          notification.read
                            ? "text-muted-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground/60 font-medium">
                        {notification.timestamp}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2.5 rounded-lg bg-background/80 hover:bg-primary/10 transition-colors"
                          title="Mark as read"
                        >
                          <Check size={16} className="text-primary" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2.5 rounded-lg bg-background/80 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Quick Tip Card */}
      {filteredNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
              <TrendingUp className="text-primary" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1 text-sm">
                Pro Tip
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Customize your notification preferences in Settings to control what updates you receive.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
