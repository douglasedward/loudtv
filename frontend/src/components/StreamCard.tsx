"use client";

import { Clock, Eye, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate, formatNumber, generateAvatarUrl } from "@/lib/utils";
import { Channel } from "@/types";

interface StreamCardProps {
  channel: Channel;
  className?: string;
  showCategory?: boolean;
}

export function StreamCard({
  channel,
  className,
  showCategory = true,
}: StreamCardProps) {
  return (
    <Card
      className={cn(
        "group overflow-hidden hover:shadow-lg transition-shadow",
        className
      )}
    >
      <Link href={`/channel/${channel.username}`}>
        <div className="relative aspect-video overflow-hidden">
          <img
            src={"/api/placeholder/320/180"}
            alt={channel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Live Badge */}
          {channel.currentStream.isLive && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                LIVE
              </Badge>
            </div>
          )}

          {/* Viewer Count */}
          {channel.currentStream.isLive && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {formatNumber(channel.currentStream.viewerCount)}
            </div>
          )}

          {/* Duration for non-live streams */}
          {!channel.currentStream.isLive && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              2:30:45
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Link href={`/channel/${channel.username}`} className="flex-shrink-0">
            <img
              src={generateAvatarUrl(channel.username)}
              alt={channel.username}
              className="w-10 h-10 rounded-full"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/channel/${channel.username}`}>
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {channel.title}
              </h3>
            </Link>

            <Link
              href={`/channel/${channel.username}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {channel.username}
              <span className="ml-1 text-blue-500">✓</span>
            </Link>

            {showCategory && (
              <div className="mt-1">
                <Link
                  href={`/categories/${channel.category.toLowerCase()}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {channel.category}
                </Link>
              </div>
            )}

            <div className="flex items-center mt-2 text-xs text-muted-foreground space-x-3">
              {channel.currentStream.isLive ? (
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {formatNumber(channel.currentStream.viewerCount)} watching
                </div>
              ) : (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(channel.createdAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Remove the duplicate Badge component definition since it's now imported
