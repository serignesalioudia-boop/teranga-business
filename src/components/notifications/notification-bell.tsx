"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/server/actions/notifications";

type Notification = {
  id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    getUnreadCount().then(setUnreadCount);

    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function toggleOpen() {
    if (!open) {
      setLoading(true);
      try {
        const [notifs, count] = await Promise.all([getNotifications(15), getUnreadCount()]);
        setNotifications(notifs as Notification[]);
        setUnreadCount(count);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  }

  async function handleRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const notif = notifications.find((n) => n.id === id);
      if (notif?.link) {
        setOpen(false);
        startTransition(() => router.push(notif.link!));
      }
    } catch {
      // silent
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  const TYPE_ICONS: Record<string, string> = {
    ORDER: "📦",
    PAYMENT: "💰",
    DELIVERY: "🚚",
    SYSTEM: "🔔",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        className="relative rounded-md p-2 transition hover:bg-accent"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-bold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Chargement...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Aucune notification</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-accent ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="text-lg">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-medium" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    {n.content && (
                      <p className="text-xs text-muted-foreground truncate">{n.content}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString("fr-SN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
          <div className="border-t px-4 py-2">
            <button
              onClick={() => {
                setOpen(false);
                startTransition(() => router.push("/account/notifications"));
              }}
              className="w-full text-center text-xs text-primary hover:underline"
            >
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
