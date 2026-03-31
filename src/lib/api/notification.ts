import { apiRequest } from "@/lib/client";

export const notificationApi = {
  notificationsList: () => apiRequest<any[]>("GET", "/api/notifications"),
  notificationsUnreadCount: () => apiRequest<number>("GET", "/api/notifications/unread-count"),
  notificationMarkRead: (id: number) => apiRequest<void>("PUT", `/api/notifications/${id}/read`),
  notificationMarkAllRead: () => apiRequest<void>("PUT", "/api/notifications/read-all"),
};
