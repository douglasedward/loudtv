"use client";

import { Filter, Grid, List,Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense,useEffect, useState } from "react";

import { StreamCard } from "@/components/StreamCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import { channelService } from "@/services/channel.service";
import { Channel } from "@/types";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "viewers" | "recent">(
    "relevance"
  );

  const categories = [
    "Gaming",
    "Just Chatting",
    "Music",
    "Creative",
    "Sports",
    "IRL",
    "Art",
    "Technology",
  ];

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchResults = await channelService.searchChannels(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      // Update URL without navigation
      window.history.replaceState(
        {},
        "",
        `/search?q=${encodeURIComponent(searchQuery)}`
      );
    }
  };

  const filteredResults = results.filter((channel) =>
    selectedCategory ? channel.category === selectedCategory : true
  );

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case "viewers":
        return b.viewerCount - a.viewerCount;
      case "recent":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return 0; // relevance - keep original order
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Search Channels</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                type="search"
                placeholder="Search for channels, streamers, or games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {sortedResults.length} results
              {searchQuery && ` for "${searchQuery}"`}
            </span>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "relevance" | "viewers" | "recent")
              }
              className="text-sm border rounded px-2 py-1"
            >
              <option value="relevance">Relevance</option>
              <option value="viewers">Most Viewers</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedResults.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedResults.map((channel) => (
              <StreamCard key={channel.id} channel={channel} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedResults.map((channel) => (
              <Card key={channel.id}>
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={channel.thumbnail || "/api/placeholder/160/90"}
                        alt={channel.title}
                        className="w-40 h-24 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-lg line-clamp-1">
                            {channel.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {channel.streamer.displayName}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{channel.category}</Badge>
                            {channel.isLive ? (
                              <span className="flex items-center text-red-500">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />
                                {formatNumber(channel.viewerCount)} viewers
                              </span>
                            ) : (
                              <span>Offline</span>
                            )}
                          </div>
                        </div>
                        {channel.isLive && (
                          <Badge className="bg-red-500 text-white">LIVE</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : searchQuery ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter a search term to find channels and streamers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          Loading search...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
