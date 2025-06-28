"use client";

import {
  BarChart3,
  Eye,
  Heart,
  Key,
  MessageSquare,
  Play,
  Settings,
  Share2,
  Square,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import { analyticsService } from "@/services/analytics.service";
import { channelService } from "@/services/channel.service";
import { useAuthStore } from "@/store";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [channel, setChannel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalWatchTime: 0,
    averageWatchTime: 0,
    peakViewers: 0,
    recentStreams: 0,
    followerGrowth: 0,
  });
  const [liveStats, setLiveStats] = useState<any>(null);

  useEffect(() => {
    // if (!isAuthenticated) {
    //   router.push("/auth/login");
    //   return;
    // }

    console.log(user);

    // if (!user?.isStreamer) {
    //   router.push("/");
    //   toast.error("You need to be a streamer to access this page");
    //   return;
    // }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    try {
      // Mock comprehensive channel data
      const mockChannelData = {
        id: "channel-123",
        userId: user?.id || "user-123",
        username: user?.username || "streamer_pro",
        title: "Epic Gaming Session | Building in Minecraft",
        description:
          "Join me as I build an amazing castle in creative mode! Chat commands: !discord !socials !build",
        category: "Gaming",
        tags: ["Minecraft", "Creative", "Building", "Chill"],
        isLive: true,
        viewers: Math.floor(Math.random() * 1500) + 200, // 200-1700 viewers
        streamKey: "live_sk_" + Math.random().toString(36).substring(2, 15),
        rtmpUrl:
          process.env.NEXT_PUBLIC_STREAM_INGEST_URL ||
          "rtmp://localhost:1935/live",
        thumbnail: `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop`,
        startedAt: new Date(
          Date.now() - Math.random() * 4 * 60 * 60 * 1000
        ).toISOString(), // Started 0-4 hours ago
        language: "en",
        quality: "1080p60",
        bitrate: 6000,
        chatSettings: {
          slowMode: false,
          followersOnly: false,
          autoMod: true,
        },
        overlays: {
          alerts: true,
          chatbox: true,
          recentFollowers: true,
          donations: true,
        },
      };

      // Mock comprehensive dashboard statistics
      const mockStats = {
        totalViews: Math.floor(Math.random() * 50000) + 10000, // 10K-60K views
        totalWatchTime: Math.floor(Math.random() * 5000) + 2000, // 2K-7K minutes
        averageWatchTime: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
        peakViewers: Math.floor(Math.random() * 2000) + 500, // 500-2500 peak
        recentStreams: Math.floor(Math.random() * 20) + 8, // 8-28 streams this month
        followerGrowth: Math.floor(Math.random() * 50) + 10, // +10-60 followers this week

        // Additional detailed stats
        monthlyStats: {
          revenue: Math.floor(Math.random() * 1200) + 300, // $300-1500
          subscriptions: Math.floor(Math.random() * 80) + 20, // 20-100 subs
          donations: Math.floor(Math.random() * 50) + 10, // 10-60 donations
          avgConcurrentViewers: Math.floor(Math.random() * 400) + 100, // 100-500 avg
          chatMessages: Math.floor(Math.random() * 10000) + 5000, // 5K-15K messages
          newFollowers: Math.floor(Math.random() * 200) + 50, // 50-250 new followers
          streamHours: Math.floor(Math.random() * 60) + 20, // 20-80 hours streamed
          clipViews: Math.floor(Math.random() * 5000) + 1000, // 1K-6K clip views
        },

        // Weekly breakdown
        weeklyData: Array.from({ length: 7 }, (_, i) => ({
          day: new Date(
            Date.now() - (6 - i) * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US", { weekday: "short" }),
          viewers: Math.floor(Math.random() * 800) + 200,
          duration: Math.floor(Math.random() * 300) + 60, // 1-5 hours in minutes
          followers: Math.floor(Math.random() * 15) + 2,
          revenue: Math.floor(Math.random() * 80) + 20,
        })),

        // Top content categories
        topCategories: [
          { name: "Gaming", hours: 45, avgViewers: 450 },
          { name: "Just Chatting", hours: 12, avgViewers: 320 },
          { name: "Creative", hours: 8, avgViewers: 280 },
          { name: "Music", hours: 5, avgViewers: 200 },
        ],

        // Recent achievements
        achievements: [
          {
            type: "milestone",
            text: "Reached 10K followers!",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            type: "peak",
            text: "New viewer peak: 1,847 concurrent!",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            type: "revenue",
            text: "First $1,000 month!",
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };

      // Mock live stats (only if streaming)
      const mockLiveStats = mockChannelData.isLive
        ? {
            concurrent: mockChannelData.viewers,
            peak: Math.floor(
              mockChannelData.viewers * (1.2 + Math.random() * 0.5)
            ), // 20-70% higher than current
            totalViewers: Math.floor(
              mockChannelData.viewers * (2 + Math.random() * 2)
            ), // 2-4x current viewers total
            avgViewTime: Math.floor(Math.random() * 35) + 10, // 10-45 minutes
            chatMessagesPerMinute: Math.floor(Math.random() * 25) + 5, // 5-30 messages/min
            newFollowers: Math.floor(Math.random() * 8) + 1, // 1-8 new followers during stream
            donations: {
              count: Math.floor(Math.random() * 5), // 0-4 donations
              total: Math.floor(Math.random() * 150) + 25, // $25-175 in donations
            },
            streamHealth: {
              bitrate: 5800 + Math.floor(Math.random() * 400), // 5.8-6.2 Mbps
              fps: 59 + Math.random() * 2, // 59-61 FPS
              droppedFrames: Math.floor(Math.random() * 5), // 0-4 dropped frames
              cpuUsage: 45 + Math.random() * 30, // 45-75% CPU
              memoryUsage: 65 + Math.random() * 20, // 65-85% RAM
            },
            topChatters: [
              { username: "RegularViewer123", messages: 45 },
              { username: "SuperFan_99", messages: 38 },
              { username: "ChatMod_Sarah", messages: 31 },
              { username: "GamingBuddy", messages: 27 },
              { username: "LoyalFollower", messages: 24 },
            ],
            recentEvents: [
              {
                type: "follow",
                user: "NewViewer47",
                timestamp: Date.now() - 2 * 60 * 1000,
              },
              {
                type: "subscription",
                user: "GenerousFan",
                amount: 4.99,
                timestamp: Date.now() - 8 * 60 * 1000,
              },
              {
                type: "donation",
                user: "SupportiveViewer",
                amount: 15.0,
                message: "Keep up the great content!",
                timestamp: Date.now() - 15 * 60 * 1000,
              },
              {
                type: "raid",
                user: "FriendlyStreamer",
                viewers: 43,
                timestamp: Date.now() - 25 * 60 * 1000,
              },
            ],
          }
        : null;

      // Mock recent activity with more detailed information
      const mockRecentActivity = [
        {
          type: "followers",
          icon: "Users",
          message: `${
            Math.floor(Math.random() * 12) + 3
          } new followers in the last 24 hours`,
          timestamp: new Date(
            Date.now() - Math.random() * 24 * 60 * 60 * 1000
          ).toISOString(),
          data: { count: Math.floor(Math.random() * 12) + 3 },
        },
        {
          type: "stream",
          icon: "Video",
          message: `Last stream: ${
            Math.floor(Math.random() * 4) + 1
          } hours, ${Math.floor(Math.random() * 60)} minutes`,
          timestamp: new Date(
            Date.now() - Math.random() * 48 * 60 * 60 * 1000
          ).toISOString(),
          data: { duration: "2h 34m", peakViewers: 1247, avgViewers: 890 },
        },
        {
          type: "milestone",
          icon: "TrendingUp",
          message: `Reached ${formatNumber(
            Math.floor(Math.random() * 5000) + 15000
          )} total views!`,
          timestamp: new Date(
            Date.now() - Math.random() * 72 * 60 * 60 * 1000
          ).toISOString(),
          data: { milestone: "views" },
        },
        {
          type: "revenue",
          icon: "Heart",
          message: `$${
            Math.floor(Math.random() * 150) + 50
          } earned from donations this week`,
          timestamp: new Date(
            Date.now() - Math.random() * 168 * 60 * 60 * 1000
          ).toISOString(),
          data: { amount: Math.floor(Math.random() * 150) + 50 },
        },
        {
          type: "engagement",
          icon: "MessageSquare",
          message: `${formatNumber(
            Math.floor(Math.random() * 2000) + 1000
          )} chat messages in last stream`,
          timestamp: new Date(
            Date.now() - Math.random() * 48 * 60 * 60 * 1000
          ).toISOString(),
          data: { messages: Math.floor(Math.random() * 2000) + 1000 },
        },
      ];

      // Set all the mock data
      setChannel({ ...mockChannelData });
      setStats(mockStats);
      setLiveStats(mockLiveStats);

      // Store additional data for potential use in components
      if (window) {
        (window as any).dashboardMockData = {
          recentActivity: mockRecentActivity,
          weeklyData: mockStats.weeklyData,
          topCategories: mockStats.topCategories,
          achievements: mockStats.achievements,
          monthlyStats: mockStats.monthlyStats,
        };
      }

      // Simulate loading delay for realism

      // Load live stats if streaming
      // if (mockChannelData.isLive) {
      //   const liveData = await analyticsService.getLiveViewerStats(
      //     mockChannelData.id
      //   );
      //   setLiveStats(liveData);
      // }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStream = async () => {
    if (!channel) return;

    setIsStreamLoading(true);
    try {
      await channelService.startStream(channel.id);
      toast.success("Stream started successfully!");
      loadDashboardData(); // Refresh data
    } catch (err) {
      console.error("Failed to start stream:", err);
      toast.error("Failed to start stream");
    } finally {
      setIsStreamLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!channel) return;

    setIsStreamLoading(true);
    try {
      await channelService.endStream(channel.id);
      toast.success("Stream ended successfully!");
      loadDashboardData(); // Refresh data
    } catch (err) {
      console.error("Failed to end stream:", err);
      toast.error("Failed to end stream");
    } finally {
      setIsStreamLoading(false);
    }
  };

  const generateStreamKey = async () => {
    if (!channel) return;

    try {
      const response = await channelService.generateStreamKey(channel.id);
      toast.success("New stream key generated!");
      setChannel({ ...channel, streamKey: response.streamKey });
    } catch (err) {
      console.error("Failed to generate stream key:", err);
      toast.error("Failed to generate stream key");
    }
  };

  const copyStreamKey = () => {
    if (channel?.streamKey) {
      navigator.clipboard.writeText(channel.streamKey);
      toast.success("Stream key copied to clipboard!");
    }
  };

  // if (!isAuthenticated || !user?.isStreamer) {
  //   return null;
  // }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your stream and track your performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {channel?.isLive && (
            <Badge className="bg-red-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
          )}
          <Link href={`/channel/${user?.username}`} target="_blank">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Channel
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Views
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalViews)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Peak Viewers
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.peakViewers)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Followers
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(user?.followers || 500)}
                </p>
                <p className="text-xs text-green-600">
                  +{stats.followerGrowth} this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Streams
                </p>
                <p className="text-2xl font-bold">{stats.recentStreams}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stream Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Stream Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Stream Status</p>
                <p className="text-sm text-muted-foreground">
                  {channel?.isLive ? "Currently streaming" : "Offline"}
                </p>
              </div>
              <div className="flex space-x-2">
                {channel?.isLive ? (
                  <Button
                    onClick={handleEndStream}
                    loading={isStreamLoading}
                    variant="destructive"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Stream
                  </Button>
                ) : (
                  <Button onClick={handleStartStream} loading={isStreamLoading}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Stream
                  </Button>
                )}
              </div>
            </div>

            {channel?.isLive && liveStats && (
              <div className="bg-muted rounded-lg p-4 space-y-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  Live Performance
                </h4>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Viewers</p>
                    <p className="font-bold text-lg">
                      {formatNumber(liveStats.concurrent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak Today</p>
                    <p className="font-bold text-lg">
                      {formatNumber(liveStats.peak)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">New Followers</p>
                    <p className="font-bold text-lg text-green-600">
                      +{liveStats.newFollowers}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Chat Rate</p>
                    <p className="font-bold text-lg text-blue-600">
                      {liveStats.chatMessagesPerMinute}/min
                    </p>
                  </div>
                </div>

                {/* Stream Health Indicators */}
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Stream Health
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Bitrate:</span>
                      <span className="font-medium">
                        {(liveStats.streamHealth.bitrate / 1000).toFixed(1)}Mbps
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>FPS:</span>
                      <span className="font-medium">
                        {Math.round(liveStats.streamHealth.fps)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CPU:</span>
                      <span
                        className={`font-medium ${
                          liveStats.streamHealth.cpuUsage > 80
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {Math.round(liveStats.streamHealth.cpuUsage)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dropped:</span>
                      <span
                        className={`font-medium ${
                          liveStats.streamHealth.droppedFrames > 3
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {liveStats.streamHealth.droppedFrames}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Stream Events */}
                {liveStats.recentEvents &&
                  liveStats.recentEvents.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Recent Events
                      </p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {liveStats.recentEvents
                          .slice(0, 3)
                          .map((event: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs"
                            >
                              <span>
                                {event.type === "follow" &&
                                  `${event.user} followed`}
                                {event.type === "subscription" &&
                                  `${event.user} subscribed ($${event.amount})`}
                                {event.type === "donation" &&
                                  `${event.user} donated $${event.amount}`}
                                {event.type === "raid" &&
                                  `${event.user} raided with ${event.viewers} viewers`}
                              </span>
                              <span className="text-muted-foreground">
                                {Math.round(
                                  (Date.now() - event.timestamp) / 60000
                                )}
                                m ago
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Stream Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">RTMP Server</p>
              <div className="bg-muted rounded p-2 text-sm font-mono">
                {process.env.NEXT_PUBLIC_STREAM_INGEST_URL ||
                  "rtmp://localhost:1935/live"}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Stream Key</p>
              <div className="flex space-x-2">
                <div className="bg-muted rounded p-2 text-sm font-mono flex-1">
                  {channel?.streamKey
                    ? `${channel.streamKey.substring(0, 8)}...`
                    : "No stream key generated"}
                </div>
                <Button
                  onClick={copyStreamKey}
                  size="sm"
                  disabled={!channel?.streamKey}
                >
                  Copy
                </Button>
                <Button onClick={generateStreamKey} size="sm" variant="outline">
                  Generate
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Use OBS, XSplit, or any RTMP-compatible software to stream.</p>
              <p>Keep your stream key private and secure.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Average Watch Time</span>
                <span className="font-medium">
                  {Math.round(stats.averageWatchTime)} minutes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Watch Time</span>
                <span className="font-medium">
                  {Math.round(stats.totalWatchTime / 60)} hours
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Follower Growth</span>
                <span className="font-medium text-green-600">
                  +{stats.followerGrowth}
                </span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Channel Settings
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Moderation Tools
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Growth Tips
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Promote Stream
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dynamic recent activity from mock data */}
            {(window as any)?.dashboardMockData?.recentActivity
              ?.slice(0, 5)
              .map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 text-sm border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex-shrink-0">
                    {activity.type === "followers" && (
                      <Users className="w-4 h-4 text-blue-500" />
                    )}
                    {activity.type === "stream" && (
                      <Video className="w-4 h-4 text-green-500" />
                    )}
                    {activity.type === "milestone" && (
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                    )}
                    {activity.type === "revenue" && (
                      <Heart className="w-4 h-4 text-red-500" />
                    )}
                    {activity.type === "engagement" && (
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.message}
                    </p>
                    {activity.data && (
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.type === "stream" &&
                          activity.data.peakViewers && (
                            <span>
                              Peak: {formatNumber(activity.data.peakViewers)}{" "}
                              viewers
                            </span>
                          )}
                        {activity.type === "revenue" && (
                          <span>Weekly total: ${activity.data.amount}</span>
                        )}
                        {activity.type === "engagement" && (
                          <span>
                            Avg: {Math.round(activity.data.messages / 120)}{" "}
                            msgs/min
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              )) || (
              // Fallback static content if mock data isn't available
              <>
                <div className="flex items-center space-x-4 text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>5 new followers in the last 24 hours</span>
                  <span className="text-muted-foreground">
                    {formatDate(new Date().toISOString())}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <Video className="w-4 h-4 text-green-500" />
                  <span>Last stream: 2 hours, 15 minutes</span>
                  <span className="text-muted-foreground">Yesterday</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span>Peak viewers: {formatNumber(stats.peakViewers)}</span>
                  <span className="text-muted-foreground">Last stream</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
