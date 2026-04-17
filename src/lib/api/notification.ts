import { apiRequest } from "@/lib/client";

export const notificationApi = {
  notificationsList: () => apiRequest<any[]>("GET", "/api/notifications"),
  notificationsUnreadCount: () => apiRequest<number>("GET", "/api/notifications/unread-count"),
  notificationMarkRead: (id: number) => apiRequest<void>("PUT", `/api/notifications/${id}/read`),
  notificationMarkAllRead: () => apiRequest<void>("PUT", "/api/notifications/read-all"),

  // ── 알림 채널 선호도 ──
  notificationPreferences: () => apiRequest<any[]>("GET", "/api/notification-preferences"),
  notificationPreferenceUpdate: (data: { channel: string; enabled: boolean; consented: boolean }) =>
    apiRequest<void>("PUT", "/api/notification-preferences", data),
};
