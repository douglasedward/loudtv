"use client";

import { Star, TrendingUp, Users, Video } from "lucide-react";
import { useEffect, useState } from "react";

import { StreamCard } from "@/components/StreamCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { channelService } from "@/services/channel.service";
import { Channel } from "@/types";

export default function HomePage() {
  const [liveChannels, setLiveChannels] = useState<Channel[]>([]);
  const [trendingChannels, setTrendingChannels] = useState<Channel[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViewers: 0,
    liveStreams: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [live, trending] = await Promise.all([
        channelService.getLive(),
        channelService.getTrending(),
      ]);

      setLiveChannels(live);
      setTrendingChannels(trending);
      setFeaturedCategories([
        "Gaming",
        "Just Chatting",
        "Music",
        "Creative",
        "Sports",
      ]);
      setStats({
        totalViewers: live.reduce(
          (acc, channel) => acc + channel.currentStream.viewerCount,
          0
        ),
        liveStreams: live.length,
      });
    } catch (error) {
      console.error("Error loading data:", error);
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl p-8 text-white overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to LoudTV
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Watch live streams, connect with creators, and join the community
          </p>
          <div className="flex items-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(stats.totalViewers)}
              </div>
              <div className="text-sm opacity-75">Viewers Online</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(stats.liveStreams)}
              </div>
              <div className="text-sm opacity-75">Live Streams</div>
            </div>
          </div>
          <Button size="lg" className="bg-white text-black hover:bg-gray-100">
            <Video className="w-5 h-5 mr-2" />
            Start Streaming
          </Button>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </section>

      {/* Live Streams */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            Live Now
          </h2>
          <Button variant="outline">View All</Button>
        </div>

        {liveChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveChannels.slice(0, 8).map((channel) => (
              <StreamCard key={channel.id} channel={channel} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">
                No live streams at the moment
              </p>
              <p className="text-muted-foreground">
                Check back later for live content!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {featuredCategories.map((category) => (
            <Card
              key={category}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-medium">{category}</h3>
                <p className="text-sm text-muted-foreground">
                  {Math.floor(Math.random() * 50) + 10} streams
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-orange-500" />
            Trending
          </h2>
          <Button variant="outline">View All</Button>
        </div>

        {trendingChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingChannels.slice(0, 4).map((channel) => (
              <StreamCard key={channel.id} channel={channel} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mock trending content */}
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Community Stats */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-6 h-6 mr-3" />
              Community Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {formatNumber(stats.totalViewers)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Viewers
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {formatNumber(stats.liveStreams)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Live Channels
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {formatNumber(1250)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Streamers
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {formatNumber(45000)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Community Members
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
