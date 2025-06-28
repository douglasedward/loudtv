"use client";

import {
  Activity,
  Clock,
  Eye,
  Globe,
  Monitor,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo,useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

interface StreamMetrics {
  timestamp: string;
  viewers: number;
  chatMessages: number;
  bitrate: number;
  latency: number;
  quality: string;
}

interface ViewerGeography {
  country: string;
  viewers: number;
  percentage: number;
}

interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

interface StreamAnalyticsDashboardProps {
  streamId: string;
  isLive?: boolean;
  className?: string;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff8fa3"];

export function StreamAnalyticsDashboard({
  streamId,
  isLive = false,
  className,
}: StreamAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<StreamMetrics[]>([]);
  const [geography, setGeography] = useState<ViewerGeography[]>([]);
  const [devices, setDevices] = useState<DeviceStats[]>([]);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("1h");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real app, this would come from analytics service
  useEffect(() => {
    const generateMockData = () => {
      const now = new Date();
      const points = timeRange === "1h" ? 60 : timeRange === "24h" ? 24 : 7;
      const interval = timeRange === "1h" ? 1 : timeRange === "24h" ? 60 : 1440;

      const mockMetrics: StreamMetrics[] = Array.from(
        { length: points },
        (_, i) => {
          const timestamp = new Date(
            now.getTime() - (points - i - 1) * interval * 60 * 1000
          );
          const baseViewers = 1000 + Math.sin(i / 10) * 500;
          const noise = (Math.random() - 0.5) * 200;

          return {
            timestamp: timestamp.toISOString(),
            viewers: Math.max(0, Math.floor(baseViewers + noise)),
            chatMessages: Math.floor(Math.random() * 50 + 10),
            bitrate: 2000 + Math.random() * 1000,
            latency: 50 + Math.random() * 100,
            quality:
              Math.random() > 0.8
                ? "1080p"
                : Math.random() > 0.5
                ? "720p"
                : "480p",
          };
        }
      );

      const mockGeography: ViewerGeography[] = [
        { country: "United States", viewers: 450, percentage: 45 },
        { country: "United Kingdom", viewers: 200, percentage: 20 },
        { country: "Germany", viewers: 150, percentage: 15 },
        { country: "Canada", viewers: 100, percentage: 10 },
        { country: "Others", viewers: 100, percentage: 10 },
      ];

      const mockDevices: DeviceStats[] = [
        { device: "Desktop", count: 600, percentage: 60 },
        { device: "Mobile", count: 250, percentage: 25 },
        { device: "Tablet", count: 100, percentage: 10 },
        { device: "Smart TV", count: 50, percentage: 5 },
      ];

      setMetrics(mockMetrics);
      setGeography(mockGeography);
      setDevices(mockDevices);
      setIsLoading(false);
    };

    generateMockData();
  }, [streamId, timeRange]);

  const currentMetrics = useMemo(() => {
    if (metrics.length === 0) return null;
    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];

    return {
      viewers: latest.viewers,
      viewerChange: previous ? latest.viewers - previous.viewers : 0,
      avgBitrate: Math.round(
        metrics.reduce((acc, m) => acc + m.bitrate, 0) / metrics.length
      ),
      avgLatency: Math.round(
        metrics.reduce((acc, m) => acc + m.latency, 0) / metrics.length
      ),
      totalChatMessages: metrics.reduce((acc, m) => acc + m.chatMessages, 0),
      peakViewers: Math.max(...metrics.map((m) => m.viewers)),
    };
  }, [metrics]);

  const formatXAxisTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === "1h") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (timeRange === "24h") {
      return date.toLocaleTimeString([], { hour: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (isLoading || !currentMetrics) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stream Analytics</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics for your stream
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              ● LIVE
            </Badge>
          )}
          <div className="flex bg-muted rounded-lg p-1">
            {(["1h", "24h", "7d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="h-8"
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Viewers
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(currentMetrics.viewers)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp
                    className={cn(
                      "w-4 h-4 mr-1",
                      currentMetrics.viewerChange >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      currentMetrics.viewerChange >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  >
                    {currentMetrics.viewerChange >= 0 ? "+" : ""}
                    {currentMetrics.viewerChange}
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Peak Viewers
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(currentMetrics.peakViewers)}
                </p>
                <p className="text-sm text-muted-foreground">This session</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Bitrate
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(currentMetrics.avgBitrate)}
                </p>
                <p className="text-sm text-muted-foreground">kbps</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Latency
                </p>
                <p className="text-2xl font-bold">
                  {currentMetrics.avgLatency}
                </p>
                <p className="text-sm text-muted-foreground">ms</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viewer Count Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Viewer Count Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisTime}
                  minTickGap={30}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value) => [
                    formatNumber(value as number),
                    "Viewers",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="viewers"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stream Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Stream Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisTime}
                  minTickGap={30}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bitrate"
                  stroke="#82ca9d"
                  name="Bitrate (kbps)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#ffc658"
                  name="Latency (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Geography and Device Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viewer Geography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Viewer Geography
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={geography}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="viewers"
                    label={({ country, percentage }) =>
                      `${country} (${percentage}%)`
                    }
                  >
                    {geography.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatNumber(value as number),
                      "Viewers",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {geography.map((country, index) => (
                  <div
                    key={country.country}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm">{country.country}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatNumber(country.viewers)} ({country.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={devices} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="device" type="category" width={80} />
                <Tooltip
                  formatter={(value) => [
                    formatNumber(value as number),
                    "Users",
                  ]}
                />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Chat Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Chat Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxisTime}
                minTickGap={30}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value) => [value, "Messages"]}
              />
              <Bar dataKey="chatMessages" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
