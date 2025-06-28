"use client";

import {
  BadgeCheckIcon,
  Calendar,
  Eye,
  Heart,
  Play,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { StreamCard } from "@/components/StreamCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { formatDate, formatNumber, generateAvatarUrl } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { channelService } from "@/services/channel.service";
import { useAuthStore } from "@/store";
import { Channel, User } from "@/types";

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "streams" | "followers" | "following"
  >("streams");

  useEffect(() => {
    if (username) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // TODO - getUserByUsername endpoint
      // For now simulate finding the user
      const mockUser: User = {
        id: "user-123",
        username: username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        email: `${username}@example.com`,
        avatarUrl: generateAvatarUrl(username),
        isStreamer: Math.random() > 0.5,
        isVerified: Math.random() > 0.7,
        followers: Math.floor(Math.random() * 10000) + 100,
        following: Math.floor(Math.random() * 500) + 50,
        createdAt: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        bio: `Content creator and ${
          Math.random() > 0.5 ? "gamer" : "artist"
        } sharing my passion with the world!`,
      };

      setUser(mockUser);

      // Load user's channels if they're a streamer
      if (mockUser.isStreamer) {
        const channelsResponse = await channelService.getChannels(1, 20);
        // Filter to simulate user's channels
        const userChannels = channelsResponse.channels.filter(
          () => Math.random() > 0.8
        );
        setChannels(userChannels);
      }

      // Check if current user is following this user
      if (isAuthenticated && currentUser && currentUser.id !== mockUser.id) {
        try {
          const followingList = await authService.getFollowing(currentUser.id);
          setIsFollowing(followingList.some((f) => f.id === mockUser.id));
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      }

      // Load followers and following (mock data)
      const mockFollowers: User[] = Array.from({ length: 5 }, (_, i) => ({
        id: `follower-${i}`,
        username: `follower${i}`,
        displayName: `Follower ${i}`,
        email: `follower${i}@example.com`,
        avatar: generateAvatarUrl(`follower${i}`),
        isStreamer: false,
        verified: false,
        followers: 0,
        following: 0,
        createdAt: new Date().toISOString(),
      }));

      const mockFollowing: User[] = Array.from({ length: 3 }, (_, i) => ({
        id: `following-${i}`,
        username: `following${i}`,
        displayName: `Following ${i}`,
        email: `following${i}@example.com`,
        avatar: generateAvatarUrl(`following${i}`),
        isStreamer: true,
        verified: Math.random() > 0.5,
        followers: Math.floor(Math.random() * 1000),
        following: 0,
        createdAt: new Date().toISOString(),
      }));

      setFollowers(mockFollowers);
      setFollowing(mockFollowing);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("User not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !currentUser || !user) {
      toast.error("Please log in to follow users");
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await authService.unfollowUser(user.id);
        setIsFollowing(false);
        setUser({ ...user });
        toast.success(`Unfollowed ${user.displayName}`);
      } else {
        await authService.followUser(user.id);
        setIsFollowing(true);
        setUser({ ...user });
        toast.success(`Now following ${user.displayName}!`);
      }
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
      toast.success("Profile link copied to clipboard!");
    });
  };

  if (isLoading) {
    return <LoadingPage title="Loading Profile" />;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The user you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // const isOwnProfile = currentUser?.id === user.id;
  const isOwnProfile = true;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <img
              src={user.avatarUrl || generateAvatarUrl(user.username)}
              alt={user.displayName}
              className="w-32 h-32 rounded-full"
            />

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                    <h1 className="text-3xl font-bold">{user.displayName}</h1>
                    {true && (
                      <span className="text-emerald-500 text-xl">
                        <BadgeCheckIcon />
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-lg">
                    @{user.username}
                  </p>
                  {user.isStreamer && (
                    <Badge className="bg-purple-500 text-white mt-2">
                      Streamer
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  {!isOwnProfile && isAuthenticated && (
                    <Button
                      onClick={handleFollow}
                      loading={isFollowLoading}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${
                          isFollowing ? "fill-current" : ""
                        }`}
                      />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                  <Button onClick={handleShare} variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {isOwnProfile && (
                    <Button variant="outline" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {user.bio && (
                <p className="text-muted-foreground mb-4">{user.bio}</p>
              )}

              <div className="flex justify-center md:justify-start space-x-8">
                <div className="text-center">
                  <p className="font-bold text-lg">
                    {formatNumber(user.followers)}
                  </p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">
                    {formatNumber(user.following)}
                  </p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(user.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">Joined</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <Button
          variant={activeTab === "streams" ? "default" : "ghost"}
          onClick={() => setActiveTab("streams")}
        >
          <Play className="w-4 h-4 mr-2" />
          Streams ({channels.length})
        </Button>
        <Button
          variant={activeTab === "followers" ? "default" : "ghost"}
          onClick={() => setActiveTab("followers")}
        >
          <Users className="w-4 h-4 mr-2" />
          Followers ({followers.length})
        </Button>
        <Button
          variant={activeTab === "following" ? "default" : "ghost"}
          onClick={() => setActiveTab("following")}
        >
          <Eye className="w-4 h-4 mr-2" />
          Following ({following.length})
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "streams" && (
        <div>
          {user.isStreamer ? (
            channels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {channels.map((channel) => (
                  <StreamCard key={channel.id} channel={channel} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No streams yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "Start streaming to see your content here"
                      : `${user.displayName} hasn't streamed yet`}
                  </p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Not a streamer</h3>
                <p className="text-muted-foreground">
                  {user.displayName} is not currently a content creator
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "followers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followers.map((follower) => (
            <Card key={follower.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      follower.avatar || generateAvatarUrl(follower.username)
                    }
                    alt={follower.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{follower.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      @{follower.username}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "following" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {following.map((followedUser) => (
            <Card key={followedUser.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      followedUser.avatar ||
                      generateAvatarUrl(followedUser.username)
                    }
                    alt={followedUser.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <h3 className="font-medium">
                        {followedUser.displayName}
                      </h3>
                      {followedUser.verified && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{followedUser.username}
                    </p>
                    {followedUser.isStreamer && (
                      <Badge className="bg-purple-500 text-white mt-1 text-xs">
                        Streamer
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
