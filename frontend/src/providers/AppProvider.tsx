"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  Notification,
  notificationService,
} from "@/services/notification.service";
import { useAuthStore } from "@/store";

interface AppContextType {
  notifications: Notification[];
  unreadCount: number;
  isOnline: boolean;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // In production, replace with actual API call
      const mockNotifications = notificationService.getMockNotifications();
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [isAuthenticated]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load notifications when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshNotifications]);

  // // Subscribe to real-time notifications
  // useEffect(() => {
  //   if (!isAuthenticated) return;

  //   let unsubscribe: (() => void) | undefined;

  //   notificationService
  //     .subscribeToNotifications((notification) => {
  //       setNotifications((prev) => [notification, ...prev.slice(0, 49)]); // Keep last 50
  //       if (!notification.read) {
  //         setUnreadCount((prev) => prev + 1);
  //       }
  //     })
  //     .then((unsub) => {
  //       unsubscribe = unsub;
  //     });

  //   return () => {
  //     if (unsubscribe) {
  //       unsubscribe();
  //     }
  //   };
  // }, [isAuthenticated]);

  const value: AppContextType = {
    notifications,
    unreadCount,
    isOnline,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
      You are currently offline. Some features may not be available.
    </div>
  );
}
