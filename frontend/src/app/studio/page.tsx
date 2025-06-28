"use client";

import {
  Activity,
  BarChart3,
  Headphones,
  Layers,
  Monitor,
  Play,
  Settings,
  Square,
  Users,
  Video,
} from "lucide-react";
import { useEffect,useState } from "react";

import { LiveStreamStudio } from "@/components/LiveStreamStudio";
import { MultiStreamViewer } from "@/components/MultiStreamViewer";
import { StreamAnalyticsDashboard } from "@/components/StreamAnalyticsDashboard";
import { StreamOverlaySystem } from "@/components/StreamOverlaySystem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";

interface StreamerStats {
  totalFollowers: number;
  totalViews: number;
  averageViewers: number;
  streamHours: number;
  topCategory: string;
  revenueMonth: number;
}

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState("studio");
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState<StreamerStats>({
    totalFollowers: 12450,
    totalViews: 2100000,
    averageViewers: 850,
    streamHours: 234,
    topCategory: "Gaming",
    revenueMonth: 1250.5,
  });

  const handleStreamStart = () => {
    setIsStreaming(true);
  };

  const handleStreamStop = () => {
    setIsStreaming(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Studio</h1>
          <p className="text-muted-foreground">
            Advanced streaming tools and analytics for content creators
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge
            variant={isStreaming ? "destructive" : "secondary"}
            className="flex items-center space-x-2"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isStreaming ? "bg-white animate-pulse" : "bg-gray-400"
              }`}
            />
            <span>{isStreaming ? "LIVE" : "OFFLINE"}</span>
          </Badge>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {formatNumber(stats.totalFollowers)}
            </div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(stats.totalViews)}
            </div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              {formatNumber(stats.averageViewers)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Viewers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">
              {stats.streamHours}h
            </div>
            <div className="text-sm text-muted-foreground">Stream Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-bold text-indigo-500">
              {stats.topCategory}
            </div>
            <div className="text-sm text-muted-foreground">Top Category</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">
              ${stats.revenueMonth.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="studio" className="flex items-center space-x-2">
            <Video className="w-4 h-4" />
            <span>Studio</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="overlays" className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Overlays</span>
          </TabsTrigger>
          <TabsTrigger
            value="multiview"
            className="flex items-center space-x-2"
          >
            <Monitor className="w-4 h-4" />
            <span>Multi-View</span>
          </TabsTrigger>
          <TabsTrigger
            value="monitoring"
            className="flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* Live Streaming Studio */}
        <TabsContent value="studio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="w-5 h-5 mr-2" />
                Live Streaming Studio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiveStreamStudio
                streamKey="live_123456789"
                onStreamStart={handleStreamStart}
                onStreamStop={handleStreamStop}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Stream Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StreamAnalyticsDashboard
                streamId="current-stream"
                isLive={isStreaming}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overlay Management */}
        <TabsContent value="overlays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                Stream Overlay System
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative min-h-[600px] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                {/* Simulated Stream Background */}
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <h3 className="text-2xl font-bold mb-2">Stream Preview</h3>
                    <p className="text-lg opacity-75">
                      Your overlays will appear here
                    </p>
                  </div>
                </div>

                <StreamOverlaySystem
                  streamId="current-stream"
                  isStreamer={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Stream Viewer */}
        <TabsContent value="multiview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Multi-Stream Viewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiStreamViewer />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "45%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "67%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>GPU Usage</span>
                      <span>32%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: "32%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network Usage</span>
                      <span>2.5 Mbps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: "25%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stream Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Stream Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      98.5%
                    </div>
                    <div className="text-sm text-green-700">Uptime</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">45ms</div>
                    <div className="text-sm text-blue-700">Latency</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      2.1k
                    </div>
                    <div className="text-sm text-purple-700">Bitrate</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">30</div>
                    <div className="text-sm text-orange-700">FPS</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Connection Quality</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      Excellent
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Dropped Frames</span>
                    <span className="text-green-600">0 (0%)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Encoding Overload</span>
                    <span className="text-green-600">None</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    time: "2 min ago",
                    message: "Stream quality improved to 1080p",
                    type: "success",
                  },
                  {
                    time: "5 min ago",
                    message: "New follower: @streamfan123",
                    type: "info",
                  },
                  {
                    time: "8 min ago",
                    message: "Overlay updated: Follower goal",
                    type: "info",
                  },
                  {
                    time: "12 min ago",
                    message: "Bitrate adjusted to 2500 kbps",
                    type: "warning",
                  },
                  {
                    time: "15 min ago",
                    message: "Stream started successfully",
                    type: "success",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-green-500"
                          : activity.type === "warning"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="text-sm">{activity.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
