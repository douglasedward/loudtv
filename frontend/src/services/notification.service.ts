import { userApi as api } from "@/lib/api";

export interface Notification {
  id: string;
  type: "follow" | "stream_live" | "system" | "warning";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export const notificationService = {
  async getNotifications(
    page = 1,
    limit = 20
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const response = await api.get(
      `/notifications?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get("/notifications/unread-count");
    return response.data.count;
  },

  // Real-time notifications would typically use WebSocket
  // For now, we'll simulate with polling
  async subscribeToNotifications(
    callback: (notification: Notification) => void
  ): Promise<() => void> {
    // In a real app, this would establish a WebSocket connection
    const interval = setInterval(async () => {
      try {
        const response = await api.get("/notifications/latest");
        if (response.data) {
          callback(response.data);
        }
      } catch (error) {
        console.error("Error fetching latest notifications:", error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  },

  // Mock notifications for development
  getMockNotifications(): Notification[] {
    return [
      {
        id: "1",
        type: "follow",
        title: "New Follower",
        message: "john_doe started following you",
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john_doe",
      },
      {
        id: "2",
        type: "stream_live",
        title: "Stream Started",
        message: "StreamerXYZ is now live playing Call of Duty",
        read: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        actionUrl: "/channel/streamerxyz",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=streamerxyz",
      },
      {
        id: "3",
        type: "system",
        title: "System Update",
        message: "New features have been added to your dashboard",
        read: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "4",
        type: "warning",
        title: "Stream Quality Warning",
        message: "Your stream quality has dropped below recommended levels",
        read: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ];
  },
};
