"use client";

import {
  Activity,
  AlertCircle,
  Eye,
  Gift,
  Heart,
  Image,
  MessageSquare,
  Settings,
  Star,
  Target,
  Type,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import { useEffect, useRef,useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

interface OverlayConfig {
  id: string;
  type: "text" | "image" | "widget" | "alert";
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
  enabled: boolean;
  zIndex: number;
}

interface StreamAlert {
  id: string;
  type: "follow" | "subscribe" | "donation" | "raid" | "host";
  user: string;
  amount?: number;
  message?: string;
  timestamp: number;
}

interface StreamOverlaySystemProps {
  streamId: string;
  isStreamer?: boolean;
  className?: string;
}

const WIDGET_TYPES = [
  { id: "viewer-count", name: "Viewer Count", icon: Eye },
  { id: "follower-count", name: "Follower Count", icon: Users },
  { id: "chat-activity", name: "Chat Activity", icon: MessageSquare },
  { id: "recent-follows", name: "Recent Follows", icon: Heart },
  { id: "top-donator", name: "Top Donator", icon: Star },
  { id: "stream-uptime", name: "Stream Uptime", icon: Activity },
  { id: "sound-reactive", name: "Sound Reactive", icon: Volume2 },
  { id: "goal-tracker", name: "Goal Tracker", icon: Target },
];

const ALERT_TEMPLATES = [
  {
    id: "follow",
    name: "New Follower",
    template: "{user} just followed!",
    color: "#3b82f6",
    sound: "/sounds/follow.mp3",
  },
  {
    id: "subscribe",
    name: "New Subscriber",
    template: "{user} just subscribed!",
    color: "#10b981",
    sound: "/sounds/subscribe.mp3",
  },
  {
    id: "donation",
    name: "Donation",
    template: "{user} donated ${amount}! {message}",
    color: "#f59e0b",
    sound: "/sounds/donation.mp3",
  },
  {
    id: "raid",
    name: "Raid",
    template: "{user} is raiding with {amount} viewers!",
    color: "#8b5cf6",
    sound: "/sounds/raid.mp3",
  },
];

export function StreamOverlaySystem({
  streamId,
  isStreamer = false,
  className,
}: StreamOverlaySystemProps) {
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);
  const [alerts, setAlerts] = useState<StreamAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<StreamAlert | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [streamData, setStreamData] = useState({
    viewers: 0,
    followers: 0,
    uptime: 0,
    chatActivity: 0,
    recentFollows: [] as string[],
    topDonator: { name: "", amount: 0 },
    currentGoal: { name: "Follower Goal", current: 0, target: 1000 },
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize default overlays
  useEffect(() => {
    const defaultOverlays: OverlayConfig[] = [
      {
        id: "viewer-count",
        type: "widget",
        position: { x: 20, y: 20 },
        size: { width: 200, height: 60 },
        content: { type: "viewer-count" },
        enabled: true,
        zIndex: 10,
      },
      {
        id: "recent-follows",
        type: "widget",
        position: { x: 20, y: 100 },
        size: { width: 250, height: 120 },
        content: { type: "recent-follows" },
        enabled: true,
        zIndex: 10,
      },
      {
        id: "goal-tracker",
        type: "widget",
        position: { x: 20, y: 240 },
        size: { width: 300, height: 80 },
        content: { type: "goal-tracker" },
        enabled: true,
        zIndex: 10,
      },
    ];

    setOverlays(defaultOverlays);
  }, []);

  // Mock stream data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamData((prev) => ({
        ...prev,
        viewers: Math.max(
          0,
          prev.viewers + Math.floor((Math.random() - 0.5) * 20)
        ),
        followers: prev.followers + (Math.random() > 0.9 ? 1 : 0),
        uptime: prev.uptime + 1,
        chatActivity: Math.floor(Math.random() * 50),
      }));

      // Simulate random alerts
      if (Math.random() > 0.95) {
        const alertTypes: StreamAlert["type"][] = [
          "follow",
          "subscribe",
          "donation",
        ];
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];

        const newAlert: StreamAlert = {
          id: Date.now().toString(),
          type,
          user: `User${Math.floor(Math.random() * 1000)}`,
          amount:
            type === "donation"
              ? Math.floor(Math.random() * 100) + 1
              : undefined,
          message:
            type === "donation" ? "Thanks for the great stream!" : undefined,
          timestamp: Date.now(),
        };

        setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]);
        showAlert(newAlert);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const showAlert = (alert: StreamAlert) => {
    setCurrentAlert(alert);

    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    alertTimeoutRef.current = setTimeout(() => {
      setCurrentAlert(null);
    }, 5000);
  };

  const handleOverlayMove = (
    id: string,
    newPosition: { x: number; y: number }
  ) => {
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id ? { ...overlay, position: newPosition } : overlay
      )
    );
  };

  const toggleOverlay = (id: string) => {
    setOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id ? { ...overlay, enabled: !overlay.enabled } : overlay
      )
    );
  };

  const addWidget = (widgetType: string) => {
    const newOverlay: OverlayConfig = {
      id: `${widgetType}-${Date.now()}`,
      type: "widget",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      content: { type: widgetType },
      enabled: true,
      zIndex: 10,
    };

    setOverlays((prev) => [...prev, newOverlay]);
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const renderWidget = (overlay: OverlayConfig) => {
    const { content } = overlay;

    switch (content.type) {
      case "viewer-count":
        return (
          <div className="bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-red-500" />
              <span className="font-bold">
                {formatNumber(streamData.viewers)}
              </span>
              <span className="text-sm">viewers</span>
            </div>
          </div>
        );

      case "recent-follows":
        return (
          <div className="bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm">Recent Follows</span>
            </div>
            <div className="space-y-1">
              {alerts
                .filter((a) => a.type === "follow")
                .slice(0, 3)
                .map((alert) => (
                  <div key={alert.id} className="text-xs opacity-80">
                    {alert.user}
                  </div>
                ))}
            </div>
          </div>
        );

      case "goal-tracker":
        const progress =
          (streamData.currentGoal.current / streamData.currentGoal.target) *
          100;
        return (
          <div className="bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="font-bold text-sm">
                {streamData.currentGoal.name}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>{streamData.currentGoal.current}</span>
                <span>{streamData.currentGoal.target}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-center text-xs">{Math.round(progress)}%</div>
            </div>
          </div>
        );

      case "stream-uptime":
        return (
          <div className="bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="font-bold">
                {formatUptime(streamData.uptime)}
              </span>
            </div>
          </div>
        );

      case "chat-activity":
        return (
          <div className="bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span className="font-bold">{streamData.chatActivity}</span>
              <span className="text-sm">msg/min</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
            <span className="text-sm">Widget: {content.type}</span>
          </div>
        );
    }
  };

  const renderAlert = (alert: StreamAlert) => {
    const template = ALERT_TEMPLATES.find((t) => t.id === alert.type);
    if (!template) return null;

    const message = template.template
      .replace("{user}", alert.user)
      .replace("{amount}", alert.amount?.toString() || "")
      .replace("{message}", alert.message || "");

    return (
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in-50 duration-500"
        style={{ zIndex: 1000 }}
      >
        <Card className="w-96 border-2" style={{ borderColor: template.color }}>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: template.color }}
              >
                {alert.type === "follow" && (
                  <Heart className="w-8 h-8 text-white" />
                )}
                {alert.type === "subscribe" && (
                  <Star className="w-8 h-8 text-white" />
                )}
                {alert.type === "donation" && (
                  <Gift className="w-8 h-8 text-white" />
                )}
                {alert.type === "raid" && (
                  <Zap className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: template.color }}
                >
                  {template.name}
                </h3>
                <p className="text-lg mt-2">{message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Overlay Container */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {overlays
          .filter((overlay) => overlay.enabled)
          .map((overlay) => (
            <div
              key={overlay.id}
              className={cn(
                "absolute",
                isEditing &&
                  "pointer-events-auto cursor-move border-2 border-dashed border-blue-500"
              )}
              style={{
                left: overlay.position.x,
                top: overlay.position.y,
                width: overlay.size.width,
                height: overlay.size.height,
                zIndex: overlay.zIndex,
              }}
              onClick={() => isEditing && setSelectedOverlay(overlay.id)}
            >
              {renderWidget(overlay)}
              {isEditing && selectedOverlay === overlay.id && (
                <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                  {overlay.content.type}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Alert Overlay */}
      {currentAlert && renderAlert(currentAlert)}

      {/* Streamer Controls */}
      {isStreamer && (
        <div className="absolute top-4 right-4 z-30">
          <div className="flex items-center space-x-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {isEditing ? "Done" : "Edit Overlays"}
            </Button>
          </div>

          {isEditing && (
            <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-lg">Overlay Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Overlays */}
                <div>
                  <h4 className="font-medium mb-2">Active Overlays</h4>
                  <div className="space-y-2">
                    {overlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">{overlay.content.type}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOverlay(overlay.id)}
                        >
                          {overlay.enabled ? "Hide" : "Show"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Widgets */}
                <div>
                  <h4 className="font-medium mb-2">Add Widget</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {WIDGET_TYPES.map((widget) => (
                      <Button
                        key={widget.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addWidget(widget.id)}
                        className="justify-start"
                      >
                        <widget.icon className="w-4 h-4 mr-2" />
                        {widget.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Recent Alerts */}
                <div>
                  <h4 className="font-medium mb-2">Recent Alerts</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between text-xs p-1 border rounded"
                      >
                        <span>
                          {alert.type}: {alert.user}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showAlert(alert)}
                          className="h-6 px-2"
                        >
                          Replay
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
