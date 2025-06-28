"use client";

import { Calendar, Eye, Heart, Play, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Chat } from "@/components/Chat";
import { StreamCard } from "@/components/StreamCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber, generateAvatarUrl } from "@/lib/utils";
import { channelService } from "@/services/channel.service";
import { useAuthStore } from "@/store";
import { Channel } from "@/types";
import { AdvancedVideoPlayer } from "@/components/AdvancedVideoPlayer";

export default function ChannelPage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [relatedChannels, setRelatedChannels] = useState<Channel[]>([]);
  const [streamHealth, setStreamHealth] = useState<any>(null);

  // Mock related channels data
  const createMockRelatedChannels = (category: string): Channel[] => {
    const mockChannels: Channel[] = [
      {
        id: "1",
        title: "Epic Gaming Marathon - 24hr Stream!",
        description:
          "Playing the latest games all night long. Join the community!",
        category: category,
        language: "en",
        userId: "user1",
        username: "GamerPro2024",
        tags: ["gaming", "fps", "multiplayer"],
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date().toISOString(),
        currentStream: {
          isLive: true,
          viewerCount: 1247,
          peakViewers: 2850,
          _id: "stream1",
        },
        moderation: {
          status: "approved",
          reports: 0,
          _id: "mod1",
        },
        stats: {
          totalViews: 125000,
          totalStreams: 85,
          followersCount: 15420,
          averageViewers: 892,
          totalWatchTime: 450000,
        },
        streamSettings: {
          quality: "1080p",
          bitrate: 6000,
          fps: 60,
          enableChat: true,
          chatMode: "all",
        },
      },
      {
        id: "2",
        title: "Chill Music Production Session",
        description:
          "Creating beats and vibes. Come hang out and learn some production tips!",
        category: category,
        language: "en",
        userId: "user2",
        username: "BeatMaker_Music",
        tags: ["music", "production", "chill"],
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date().toISOString(),
        currentStream: {
          isLive: false,
          viewerCount: 0,
          peakViewers: 580,
          _id: "stream2",
        },
        moderation: {
          status: "approved",
          reports: 0,
          _id: "mod2",
        },
        stats: {
          totalViews: 45000,
          totalStreams: 42,
          followersCount: 8920,
          averageViewers: 320,
          totalWatchTime: 180000,
        },
        streamSettings: {
          quality: "720p",
          bitrate: 3500,
          fps: 30,
          enableChat: true,
          chatMode: "followers",
        },
      },
      {
        id: "3",
        title: "Learning JavaScript - Beginner Friendly",
        description:
          "Teaching web development fundamentals. Questions welcome!",
        category: category,
        language: "en",
        userId: "user3",
        username: "CodeTeacher_JS",
        tags: ["coding", "javascript", "tutorial"],
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        updatedAt: new Date().toISOString(),
        currentStream: {
          isLive: true,
          viewerCount: 342,
          peakViewers: 450,
          _id: "stream3",
        },
        moderation: {
          status: "approved",
          reports: 0,
          _id: "mod3",
        },
        stats: {
          totalViews: 78000,
          totalStreams: 95,
          followersCount: 12500,
          averageViewers: 285,
          totalWatchTime: 320000,
        },
        streamSettings: {
          quality: "1080p",
          bitrate: 4500,
          fps: 30,
          enableChat: true,
          chatMode: "all",
        },
      },
      {
        id: "4",
        title: "Art Stream - Digital Painting",
        description:
          "Creating digital artwork live. Watch the creative process unfold!",
        category: category,
        language: "en",
        userId: "user4",
        username: "DigitalArtist_Pro",
        tags: ["art", "digital", "painting"],
        createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
        updatedAt: new Date().toISOString(),
        currentStream: {
          isLive: false,
          viewerCount: 0,
          peakViewers: 720,
          _id: "stream4",
        },
        moderation: {
          status: "approved",
          reports: 0,
          _id: "mod4",
        },
        stats: {
          totalViews: 95000,
          totalStreams: 68,
          followersCount: 18750,
          averageViewers: 450,
          totalWatchTime: 280000,
        },
        streamSettings: {
          quality: "1080p",
          bitrate: 5500,
          fps: 60,
          enableChat: true,
          chatMode: "all",
        },
      },
    ];

    return mockChannels.slice(0, 4); // Return up to 4 channels
  };

  useEffect(() => {
    if (username) {
      loadChannelData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const loadChannelData = async () => {
    try {
      // Find channel by username
      const foundChannel = await channelService.findByUsername(username);

      if (!foundChannel) {
        throw new Error("Channel not found");
      }

      setChannel(foundChannel);

      // Load related data - using mock data for now
      try {
        const related = await channelService.findAll({
          page: 1,
          limit: 4,
          category: foundChannel.category,
        });
        const filteredRelated = related.channels.filter(
          (c) => c.id !== foundChannel.id
        );

        // If no related channels found, use mock data
        if (filteredRelated.length === 0) {
          const mockRelated = createMockRelatedChannels(foundChannel.category);
          setRelatedChannels(
            mockRelated.filter((c) => c.id !== foundChannel.id)
          );
        } else {
          setRelatedChannels(filteredRelated);
        }
      } catch (error) {
        console.log("Using mock related channels data");
        // Fallback to mock data if API fails
        const mockRelated = createMockRelatedChannels(foundChannel.category);
        setRelatedChannels(mockRelated.filter((c) => c.id !== foundChannel.id));
      }

      // // Check if following (if authenticated)
      // if (isAuthenticated && currentUser) {
      //   try {
      //     const followers = await authService.getFollowing(currentUser.id);
      //     setIsFollowing(
      //       followers.some((f) => f.id === foundChannel.streamer.id)
      //     );
      //   } catch (error) {
      //     console.error("Error checking follow status:", error);
      //   }
      // }

      // // Get stream health if live
      // if (foundChannel.currentStream.isLive) {
      //   try {
      //     const health = await channelService.getStreamHealth(foundChannel.id);
      //     setStreamHealth(health);
      //   } catch (error) {
      //     console.error("Error loading stream health:", error);
      //   }
      // }

      // // Track view
      // if (foundChannel.currentStream.isLive) {
      //   analyticsService
      //     .trackStreamView(foundChannel.id, {
      //       device: "desktop",
      //       browser: navigator.userAgent,
      //     })
      //     .catch(console.error);
      // }
    } catch (error) {
      console.error("Error loading channel:", error);
      toast.error("Channel not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !channel) {
      toast.error("Please log in to follow channels");
      return;
    }

    setIsFollowLoading(true);
    try {
      console.log(`Toggling follow for channel: ${channel.id}`);

      // if (isFollowing) {
      //   await authService.unfollowUser(channel.streamer.id);
      //   setIsFollowing(false);
      //   toast.success(`Unfollowed ${channel.streamer.displayName}`);
      // } else {
      //   await authService.followUser(channel.streamer.id);
      //   setIsFollowing(true);
      //   toast.success(`Now following ${channel.streamer.displayName}!`);
      //   // Track interaction
      //   analyticsService
      //     .trackStreamInteraction(channel.id, {
      //       type: "follow",
      //     })
      //     .catch(console.error);
      // }
    } catch (err) {
      console.error("Failed to update follow status:", err);
      toast.error("Failed to update follow status");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Channel link copied to clipboard!");
    });
  };

  const handleViewerJoin = () => {
    // if (channel) {
    //   analyticsService
    //     .trackStreamView(channel.id, {
    //       device: "desktop",
    //       browser: navigator.userAgent,
    //     })
    //     .catch(console.error);
    // }
  };

  const handleViewerLeave = () => {
    // Track viewer leave if needed
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="aspect-video bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Channel Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The channel you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isChannelLive = false;
  const viewerCount = channel.currentStream.viewerCount || 0;
  const streamUrl = isChannelLive
    ? `${process.env.NEXT_PUBLIC_HLS_BASE_URL}/${username}/master.m3u8`
    : undefined;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video Player */}
          <div className="relative">
            <AdvancedVideoPlayer streamUrl={streamUrl} isLive={isChannelLive} />

            {/* Stream Status Overlay */}
            {isChannelLive && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <Badge className="bg-red-500 text-white">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-black bg-opacity-70 text-white"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {formatNumber(viewerCount)}
                </Badge>
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{channel.title}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <Badge variant="outline">{channel.category}</Badge>
                {isChannelLive ? (
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {formatNumber(viewerCount)} watching
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(channel.createdAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Streamer Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={generateAvatarUrl(channel.username)}
                  alt={channel.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{channel.username}</h3>
                    {true && <span className="text-blue-500">✓</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(Math.random() * 100000) + 1000} followers
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleFollow}
                  loading={isFollowLoading}
                  variant={isFollowing ? "outline" : "default"}
                  disabled={
                    !isAuthenticated || currentUser?.id === channel.userId
                  }
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${
                      isFollowing ? "fill-current" : ""
                    }`}
                  />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button onClick={handleShare} variant="outline" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
                {currentUser?.id === channel.userId && (
                  <Button variant="outline" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {channel.description && (
              <div className="bg-muted rounded-lg p-4">
                <p className="whitespace-pre-wrap">{channel.description}</p>
              </div>
            )}

            {/* Stream Health (for streamers) */}
            {streamHealth && currentUser?.id === channel.userId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stream Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {Math.round(streamHealth.bitrate / 1000)}k
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bitrate
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-500">
                        {streamHealth.fps}
                      </div>
                      <div className="text-sm text-muted-foreground">FPS</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-500">
                        {streamHealth.resolution}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Resolution
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-500">
                        {formatNumber(streamHealth.viewers)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Viewers
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Related Streams */}
          {relatedChannels.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                More in {channel.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedChannels.map((relatedChannel) => (
                  <StreamCard
                    key={relatedChannel.id}
                    channel={relatedChannel}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          {isChannelLive ? (
            <Chat
              channelId={channel.id}
              viewerCount={channel.currentStream.viewerCount}
              className="h-[600px]"
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Stream is Offline</h3>
                <p className="text-muted-foreground text-sm">
                  Chat will be available when the stream goes live
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
