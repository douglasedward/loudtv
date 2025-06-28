"use client";

import { AlertTriangle,Bell, Info, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "follow" | "stream_live" | "system" | "warning";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  avatar?: string;
}

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(
    mockNotifications.filter((n) => !n.read).length
  );

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        size="icon"
        variant="ghost"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center p-0">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden z-50">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer group",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          getNotificationIcon(notification.type)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// Mock notifications - in real app, fetch from API
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "follow",
    title: "New Follower",
    message: "JohnGamer started following you",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    actionUrl: "/dashboard",
    // avatar: "/api/placeholder/32/32",
  },
  {
    id: "2",
    type: "stream_live",
    title: "Stream Started",
    message: "TechStreamer just went live playing Cyberpunk 2077",
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    actionUrl: "/channel/techstreamer",
    // avatar: "/api/placeholder/32/32",
  },
  {
    id: "3",
    type: "system",
    title: "System Update",
    message: "New features have been added to the platform",
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    type: "warning",
    title: "Stream Quality Alert",
    message: "Your stream quality has dropped. Check your connection.",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actionUrl: "/dashboard",
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "follow":
      return <Bell className="w-4 h-4 text-blue-500" />;
    case "stream_live":
      return <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />;
    case "system":
      return <Info className="w-4 h-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};
