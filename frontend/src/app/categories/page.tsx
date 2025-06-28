"use client";

import { Eye, Grid, Star,TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect,useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { analyticsService } from "@/services/analytics.service";

const categories = [
  {
    id: "gaming",
    name: "Gaming",
    icon: "🎮",
    description: "Play and watch the latest games",
    color: "from-purple-500 to-purple-700",
  },
  {
    id: "just-chatting",
    name: "Just Chatting",
    icon: "💬",
    description: "Conversations and community",
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "music",
    name: "Music",
    icon: "🎵",
    description: "Live performances and DJ sets",
    color: "from-pink-500 to-pink-700",
  },
  {
    id: "creative",
    name: "Creative",
    icon: "🎨",
    description: "Art, crafting, and creative content",
    color: "from-green-500 to-green-700",
  },
  {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    description: "Sports events and commentary",
    color: "from-orange-500 to-orange-700",
  },
  {
    id: "irl",
    name: "IRL",
    icon: "🌍",
    description: "Real-life adventures",
    color: "from-teal-500 to-teal-700",
  },
  {
    id: "art",
    name: "Art",
    icon: "🖼️",
    description: "Watch artists create live",
    color: "from-indigo-500 to-indigo-700",
  },
  {
    id: "technology",
    name: "Technology",
    icon: "💻",
    description: "Tech, programming, and innovation",
    color: "from-red-500 to-red-700",
  },
  {
    id: "food",
    name: "Food & Cooking",
    icon: "🍳",
    description: "Cooking shows and food content",
    color: "from-yellow-500 to-yellow-700",
  },
  {
    id: "fitness",
    name: "Fitness",
    icon: "💪",
    description: "Workouts and health tips",
    color: "from-emerald-500 to-emerald-700",
  },
  {
    id: "education",
    name: "Education",
    icon: "📚",
    description: "Learning and tutorials",
    color: "from-violet-500 to-violet-700",
  },
  {
    id: "travel",
    name: "Travel",
    icon: "✈️",
    description: "Explore the world together",
    color: "from-cyan-500 to-cyan-700",
  },
];

export default function CategoriesPage() {
  const [categoryStats, setCategoryStats] = useState<
    Record<string, { viewerCount: number; streamCount: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategoryData();
  }, []);

  const loadCategoryData = async () => {
    try {
      const [popularCategories] = await Promise.all([
        analyticsService.getPopularCategories(),
      ]);

      // Popular categories data is now available for future use

      // Generate stats for each category (in a real app, this would come from the API)
      const stats: Record<
        string,
        { viewerCount: number; streamCount: number }
      > = {};
      categories.forEach((category) => {
        const found = popularCategories.find(
          (pc) => pc.category.toLowerCase() === category.name.toLowerCase()
        );
        stats[category.id] = {
          viewerCount:
            found?.viewerCount || Math.floor(Math.random() * 5000) + 100,
          streamCount:
            found?.streamCount || Math.floor(Math.random() * 100) + 10,
        };
      });
      setCategoryStats(stats);
    } catch (error) {
      console.error("Error loading categories:", error);
      // Generate mock data as fallback
      const stats: Record<
        string,
        { viewerCount: number; streamCount: number }
      > = {};
      categories.forEach((category) => {
        stats[category.id] = {
          viewerCount: Math.floor(Math.random() * 5000) + 100,
          streamCount: Math.floor(Math.random() * 100) + 10,
        };
      });
      setCategoryStats(stats);
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
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sort categories by viewer count for trending section
  const trendingCategories = [...categories]
    .map((cat) => ({
      ...cat,
      ...categoryStats[cat.id],
    }))
    .sort((a, b) => b.viewerCount - a.viewerCount)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Browse Categories</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Discover content that matches your interests
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <Grid className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">
                {formatNumber(
                  Object.values(categoryStats).reduce(
                    (sum, stats) => sum + stats.viewerCount,
                    0
                  )
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total Viewers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {formatNumber(
                  Object.values(categoryStats).reduce(
                    (sum, stats) => sum + stats.streamCount,
                    0
                  )
                )}
              </p>
              <p className="text-sm text-muted-foreground">Live Streams</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trending Categories */}
      <section>
        <div className="flex items-center mb-6">
          <TrendingUp className="w-6 h-6 mr-3 text-orange-500" />
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingCategories.map((category, index) => (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`}
              />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{category.icon}</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">#{index + 1}</span>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Viewers:</span>
                    <span className="font-medium text-red-500">
                      {formatNumber(category.viewerCount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Streams:</span>
                    <span className="font-medium">
                      {formatNumber(category.streamCount)}
                    </span>
                  </div>
                </div>

                <Link href={`/categories/${category.id}`}>
                  <Button className="w-full mt-4" variant="outline">
                    Browse {category.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* All Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">All Categories</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const stats = categoryStats[category.id] || {
              viewerCount: 0,
              streamCount: 0,
            };

            return (
              <Card
                key={category.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-15 transition-opacity`}
                />
                <CardContent className="p-6 relative">
                  <div className="text-center">
                    <span className="text-4xl mb-3 block">{category.icon}</span>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>

                    <div className="flex justify-between text-sm mb-4">
                      <div className="text-center">
                        <p className="font-bold text-red-500">
                          {formatNumber(stats.viewerCount)}
                        </p>
                        <p className="text-xs text-muted-foreground">viewers</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">
                          {formatNumber(stats.streamCount)}
                        </p>
                        <p className="text-xs text-muted-foreground">streams</p>
                      </div>
                    </div>

                    <Link href={`/categories/${category.id}`}>
                      <Button className="w-full" variant="outline" size="sm">
                        Explore
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Category Insights */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Category Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">
                  {categories.find((c) => c.id === trendingCategories[0]?.id)
                    ?.name || "Gaming"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Most popular category
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {Math.floor(Math.random() * 6) + 2}h
                </p>
                <p className="text-sm text-muted-foreground">
                  Average watch time
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  +{Math.floor(Math.random() * 20) + 5}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Growth this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
