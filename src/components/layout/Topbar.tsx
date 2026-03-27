import { useState } from "react";
import { Bell, Globe, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { api } from "@/lib/api";

function timeAgo(dateStr: string, t: (key: string, opts?: any) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("notification.justNow");
  if (minutes < 60) return t("notification.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("notification.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("notification.daysAgo", { count: days });
}

export default function Topbar() {
  const { user, clear } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);

  const toggleLanguage = () => {
    const next = i18n.language === "ko" ? "en" : "ko";
    i18n.changeLanguage(next);
  };

  const onLogout = async () => {
    try {
      await api.logout();
    } finally {
      clear();
      nav("/login");
    }
  };

  // Unread count with 30s polling
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.notificationsUnreadCount(),
    refetchInterval: 30000,
  });

  // Notifications list, fetched when dropdown opens
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notificationsList(),
    enabled: notifOpen,
  });

  const handleMarkAllRead = async () => {
    await api.notificationMarkAllRead();
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.readAt) {
      await api.notificationMarkRead(notif.id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    }
    if (notif.link) {
      nav(notif.link);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-base bg-surface">
      <div className="flex h-14 items-center justify-end gap-3 px-6">
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Notifications" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold">{t("notification.title")}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMarkAllRead();
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t("notification.markAllRead")}
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />

              {/* Notification list */}
              <div className="max-h-72 overflow-y-auto">
                {notifLoading ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("common.loading")}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("notification.empty")}
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className="flex cursor-pointer items-start gap-2 px-3 py-2.5"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {/* Unread indicator */}
                      <div className="mt-1.5 flex-shrink-0">
                        {!notif.readAt ? (
                          <span className="block h-2 w-2 rounded-full bg-blue-500" />
                        ) : (
                          <span className="block h-2 w-2" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{notif.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{notif.message}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          {timeAgo(notif.createdAt, t)}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" aria-label="Theme" onClick={toggle}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" aria-label="Language" onClick={toggleLanguage} title={i18n.language === "ko" ? "English" : "한국어"}>
            <Globe className="h-4 w-4" />
            <span className="ml-1 text-xs">{i18n.language === "ko" ? "KO" : "EN"}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full border border-base bg-surface px-2 py-1 hover:bg-accent">
                <Avatar>
                  <AvatarFallback>{user?.name?.slice(0, 1) ?? "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{user?.name ?? "User"}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => nav("/me")}>{t("nav.myInfo")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>{t("auth.logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
