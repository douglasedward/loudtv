"use client";

import { Eye,Filter, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect,useState } from "react";

import { StreamCard } from "@/components/StreamCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { channelService } from "@/services/channel.service";
import { Channel } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const formattedCategory = category
    ? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
    : "";

  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"viewers" | "recent">("viewers");
  const [filter, setFilter] = useState<"all" | "live" | "offline">("all");
  const [stats, setStats] = useState({
    totalChannels: 0,
    liveChannels: 0,
    totalViewers: 0,
  });

  useEffect(() => {
    if (category) {
      loadCategoryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy, filter]);

  const loadCategoryData = async () => {
    setIsLoading(true);
    try {
      const response = await channelService.getChannels(
        1,
        50,
        formattedCategory
      );
      let filteredChannels = response.channels;

      // Apply filter
      if (filter === "live") {
        filteredChannels = filteredChannels.filter((c) => c.isLive);
      } else if (filter === "offline") {
        filteredChannels = filteredChannels.filter((c) => !c.isLive);
      }

      // Apply sorting
      if (sortBy === "viewers") {
        filteredChannels.sort((a, b) => b.viewerCount - a.viewerCount);
      } else {
        filteredChannels.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      setChannels(filteredChannels);

      // Calculate stats
      const liveChannels = response.channels.filter((c) => c.isLive);
      setStats({
        totalChannels: response.channels.length,
        liveChannels: liveChannels.length,
        totalViewers: liveChannels.reduce((acc, c) => acc + c.viewerCount, 0),
      });
    } catch (error) {
      console.error("Error loading category data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      gaming: "🎮",
      "just chatting": "💬",
      music: "🎵",
      creative: "🎨",
      sports: "⚽",
      irl: "🌍",
      art: "🖼️",
      technology: "💻",
    };
    return icons[category.toLowerCase()] || "📺";
  };

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      gaming: "Watch the latest games and esports competitions",
      "just chatting": "Engage in conversations with your favorite streamers",
      music: "Listen to live performances and DJ sets",
      creative: "Discover art, crafting, and creative content",
      sports: "Follow live sports events and commentary",
      irl: "Real-life adventures and outdoor activities",
      art: "Watch artists create amazing artwork live",
      technology: "Learn about tech, programming, and innovation",
    };
    return (
      descriptions[category.toLowerCase()] ||
      `Discover amazing ${category} content`
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
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
      {/* Category Header */}
      <section className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4">
              {getCategoryIcon(formattedCategory)}
            </span>
            <div>
              <h1 className="text-4xl font-bold">{formattedCategory}</h1>
              <p className="text-xl opacity-90 mt-2">
                {getCategoryDescription(formattedCategory)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </section>

      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Channels
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalChannels)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Live Now
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.liveChannels)}
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
                  Watching Now
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalViewers)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Show:</span>
          </div>

          <div className="flex border rounded">
            {(["all", "live", "offline"] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="rounded-none first:rounded-l last:rounded-r"
              >
                {filterOption === "all"
                  ? "All Channels"
                  : filterOption === "live"
                  ? "Live Only"
                  : "Offline"}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {channels.length} channels
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border rounded px-3 py-1"
          >
            <option value="viewers">Most Viewers</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Channel Grid */}
      {channels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((channel) => (
            <StreamCard
              key={channel.id}
              channel={channel}
              showCategory={false}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <span className="text-4xl mb-4 block">
              {getCategoryIcon(formattedCategory)}
            </span>
            <h3 className="text-lg font-medium mb-2">
              No {filter === "all" ? "" : filter} channels found
            </h3>
            <p className="text-muted-foreground">
              {filter === "live"
                ? "No streams are currently live in this category"
                : filter === "offline"
                ? "All channels in this category are currently live"
                : "This category doesn't have any channels yet"}
            </p>
            {filter !== "all" && (
              <Button
                onClick={() => setFilter("all")}
                variant="outline"
                className="mt-4"
              >
                Show All Channels
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Related Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Related Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            "Gaming",
            "Just Chatting",
            "Music",
            "Creative",
            "Sports",
            "IRL",
            "Art",
            "Technology",
          ]
            .filter(
              (cat) => cat.toLowerCase() !== formattedCategory.toLowerCase()
            )
            .slice(0, 6)
            .map((relatedCategory) => (
              <Card
                key={relatedCategory}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="p-4 text-center">
                  <span className="text-2xl mb-2 block">
                    {getCategoryIcon(relatedCategory)}
                  </span>
                  <p className="font-medium text-sm">{relatedCategory}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
