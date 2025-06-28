"use client";

import { Clock, Eye, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { StreamCard } from "@/components/StreamCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { analyticsService } from "@/services/analytics.service";
import { channelService } from "@/services/channel.service";
import { Channel } from "@/types";

export default function TrendingPage() {
  const [trendingChannels, setTrendingChannels] = useState<Channel[]>([]);
  const [topCategories, setTopCategories] = useState<
    Array<{ category: string; viewerCount: number; streamCount: number }>
  >([]);
  const [timeFilter, setTimeFilter] = useState<"1h" | "24h" | "7d">("24h");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViewers: 0,
    totalStreams: 0,
    topStreams: [] as Array<{
      channelId: string;
      title: string;
      viewers: number;
    }>,
  });

  useEffect(() => {
    loadTrendingData();
  }, [timeFilter]);

  const loadTrendingData = async () => {
    setIsLoading(true);
    try {
      const [trending, categories, metrics] = await Promise.all([
        channelService.getTrending(),
        analyticsService.getPopularCategories(),
        analyticsService.getRealtimeMetrics(),
      ]);

      setTrendingChannels(trending);
      setTopCategories(categories);
      setStats(metrics);
    } catch (error) {
      console.error("Error loading trending data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
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
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-orange-500" />
            Trending
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover what&apos;s hot on LoudTV right now
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Trending in:</span>
          <div className="flex border rounded">
            {(["1h", "24h", "7d"] as const).map((period) => (
              <Button
                key={period}
                variant={timeFilter === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeFilter(period)}
                className="rounded-none first:rounded-l last:rounded-r"
              >
                {period === "1h"
                  ? "1 Hour"
                  : period === "24h"
                  ? "24 Hours"
                  : "7 Days"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Viewers
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalViewers)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Live Streams
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalStreams)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Peak Stream
                </p>
                <p className="text-2xl font-bold">
                  {stats.topStreams.length > 0
                    ? formatNumber(stats.topStreams[0].viewers)
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Trending Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topCategories.map((category, index) => (
            <Card
              key={category.category}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    #{index + 1}
                  </div>
                  <Badge variant="outline">
                    {formatNumber(category.streamCount)} streams
                  </Badge>
                </div>
                <h3 className="font-medium text-lg mb-2">
                  {category.category}
                </h3>
                <p className="text-muted-foreground">
                  {formatNumber(category.viewerCount)} viewers
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Top Streams Right Now */}
      {stats.topStreams.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Top Streams Right Now</h2>
          <div className="space-y-4">
            {stats.topStreams.slice(0, 5).map((stream, index) => (
              <Card key={stream.channelId}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{stream.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Channel ID: {stream.channelId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-500">
                        {formatNumber(stream.viewers)}
                      </p>
                      <p className="text-xs text-muted-foreground">viewers</p>
                    </div>
                    <Badge className="bg-red-500 text-white">LIVE</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Trending Channels */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trending Channels</h2>
          <Button variant="outline">View All</Button>
        </div>

        {trendingChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingChannels.map((channel) => (
              <StreamCard key={channel.id} channel={channel} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No trending content</h3>
              <p className="text-muted-foreground">
                Check back later for trending streams!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Trending by Time of Day */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Trending Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">
                  {formatNumber(Math.floor(Math.random() * 50000) + 10000)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Peak concurrent viewers today
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {Math.floor(Math.random() * 24) + 1}h
                </p>
                <p className="text-sm text-muted-foreground">
                  Average stream duration
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  +{Math.floor(Math.random() * 15) + 5}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Growth vs yesterday
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
