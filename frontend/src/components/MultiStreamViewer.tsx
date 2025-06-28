"use client";

import {
  Eye,
  Grid2X2,
  Grid3X3,
  Headphones,
  Heart,
  LayoutGrid,
  Maximize,
  Minimize,
  MoreVertical,
  Pause,
  Pin,
  PinOff,
  Play,
  Settings,
  Share2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef,useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

import { VideoPlayer } from "./VideoPlayer";

interface Stream {
  id: string;
  title: string;
  streamer: string;
  avatar: string;
  thumbnail: string;
  streamUrl: string;
  viewers: number;
  category: string;
  isLive: boolean;
  quality: "1080p" | "720p" | "480p";
  language: string;
}

interface ViewerLayout {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  gridCols: number;
  maxStreams: number;
}

interface MultiStreamViewerProps {
  availableStreams?: Stream[];
  initialStreams?: string[];
  className?: string;
}

const LAYOUTS: ViewerLayout[] = [
  {
    id: "single",
    name: "Single View",
    icon: LayoutGrid,
    gridCols: 1,
    maxStreams: 1,
  },
  {
    id: "dual",
    name: "Side by Side",
    icon: Grid2X2,
    gridCols: 2,
    maxStreams: 2,
  },
  {
    id: "quad",
    name: "Quad View",
    icon: Grid3X3,
    gridCols: 2,
    maxStreams: 4,
  },
  {
    id: "mosaic",
    name: "Mosaic (9)",
    icon: Grid3X3,
    gridCols: 3,
    maxStreams: 9,
  },
];

const MOCK_STREAMS: Stream[] = [
  {
    id: "stream1",
    title: "Epic Gaming Session - Valorant Ranked",
    streamer: "ProGamer123",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer123",
    thumbnail: "https://picsum.photos/800/450?random=1",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    viewers: 1234,
    category: "Gaming",
    isLive: true,
    quality: "1080p",
    language: "en",
  },
  {
    id: "stream2",
    title: "Chill Music & Chat Session",
    streamer: "MusicLover",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MusicLover",
    thumbnail: "https://picsum.photos/800/450?random=2",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    viewers: 567,
    category: "Music",
    isLive: true,
    quality: "720p",
    language: "en",
  },
  {
    id: "stream3",
    title: "Digital Art Creation Live",
    streamer: "ArtistCreative",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArtistCreative",
    thumbnail: "https://picsum.photos/800/450?random=3",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    viewers: 890,
    category: "Creative",
    isLive: true,
    quality: "1080p",
    language: "en",
  },
  {
    id: "stream4",
    title: "Cooking Stream - Italian Cuisine",
    streamer: "ChefMaster",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChefMaster",
    thumbnail: "https://picsum.photos/800/450?random=4",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    viewers: 456,
    category: "Food",
    isLive: true,
    quality: "720p",
    language: "en",
  },
  {
    id: "stream5",
    title: "Just Chatting - AMA Session",
    streamer: "TalkativeHost",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TalkativeHost",
    thumbnail: "https://picsum.photos/800/450?random=5",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    viewers: 234,
    category: "Just Chatting",
    isLive: true,
    quality: "480p",
    language: "en",
  },
];

export function MultiStreamViewer({
  availableStreams = MOCK_STREAMS,
  initialStreams = ["stream1", "stream2"],
  className,
}: MultiStreamViewerProps) {
  const [activeStreams, setActiveStreams] = useState<string[]>(initialStreams);
  const [currentLayout, setCurrentLayout] = useState<ViewerLayout>(LAYOUTS[1]);
  const [focusedStream, setFocusedStream] = useState<string | null>(null);
  const [mutedStreams, setMutedStreams] = useState<Set<string>>(new Set());
  const [pinnedStreams, setPinnedStreams] = useState<Set<string>>(new Set());
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [showStreamBrowser, setShowStreamBrowser] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically adjust layout based on number of active streams
  useEffect(() => {
    const streamCount = activeStreams.length;
    if (streamCount <= 1) {
      setCurrentLayout(LAYOUTS[0]); // Single
    } else if (streamCount <= 2) {
      setCurrentLayout(LAYOUTS[1]); // Dual
    } else if (streamCount <= 4) {
      setCurrentLayout(LAYOUTS[2]); // Quad
    } else {
      setCurrentLayout(LAYOUTS[3]); // Mosaic
    }
  }, [activeStreams.length]);

  const addStream = (streamId: string) => {
    if (
      activeStreams.includes(streamId) ||
      activeStreams.length >= currentLayout.maxStreams
    ) {
      return;
    }
    setActiveStreams((prev) => [...prev, streamId]);
  };

  const removeStream = (streamId: string) => {
    setActiveStreams((prev) => prev.filter((id) => id !== streamId));
    setMutedStreams((prev) => {
      const newSet = new Set(prev);
      newSet.delete(streamId);
      return newSet;
    });
    setPinnedStreams((prev) => {
      const newSet = new Set(prev);
      newSet.delete(streamId);
      return newSet;
    });
    if (focusedStream === streamId) {
      setFocusedStream(null);
    }
  };

  const toggleMute = (streamId: string) => {
    setMutedStreams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) {
        newSet.delete(streamId);
      } else {
        newSet.add(streamId);
      }
      return newSet;
    });
  };

  const togglePin = (streamId: string) => {
    setPinnedStreams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) {
        newSet.delete(streamId);
      } else {
        newSet.add(streamId);
      }
      return newSet;
    });
  };

  const focusOnStream = (streamId: string) => {
    setFocusedStream(focusedStream === streamId ? null : streamId);
  };

  const getStreamData = (streamId: string): Stream | undefined => {
    return availableStreams.find((stream) => stream.id === streamId);
  };

  const renderStreamTile = (streamId: string, index: number) => {
    const stream = getStreamData(streamId);
    if (!stream) return null;

    const isMuted = mutedStreams.has(streamId);
    const isPinned = pinnedStreams.has(streamId);
    const isFocused = focusedStream === streamId;

    return (
      <div
        key={streamId}
        className={cn(
          "relative group bg-black rounded-lg overflow-hidden transition-all",
          isFocused && "ring-2 ring-blue-500",
          isPinned && "ring-2 ring-yellow-500",
          currentLayout.gridCols === 1 ? "aspect-video" : "aspect-video"
        )}
      >
        {/* Video Player */}
        {!audioOnlyMode && (
          <VideoPlayer
            streamUrl={stream.streamUrl}
            poster={stream.thumbnail}
            autoPlay={!isMuted}
            className="w-full h-full"
          />
        )}

        {/* Audio Only Mode */}
        {audioOnlyMode && (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Headphones className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{stream.title}</h3>
              <p className="text-sm opacity-75">Audio Only Mode</p>
            </div>
          </div>
        )}

        {/* Stream Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {stream.title}
                </h3>
                <div className="flex items-center space-x-2 text-xs opacity-75">
                  <span>{stream.streamer}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {formatNumber(stream.viewers)}
                  </span>
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                LIVE
              </Badge>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toggleMute(streamId)}
            className="h-8 w-8 p-0"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => togglePin(streamId)}
            className="h-8 w-8 p-0"
          >
            {isPinned ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => focusOnStream(streamId)}
            className="h-8 w-8 p-0"
          >
            {isFocused ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => removeStream(streamId)}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>

        {/* Stream Quality Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className="text-xs bg-black/50 text-white border-white/20"
          >
            {stream.quality}
          </Badge>
        </div>

        {/* Pinned Indicator */}
        {isPinned && (
          <div className="absolute top-2 left-2 ml-12">
            <Badge
              variant="outline"
              className="text-xs bg-yellow-500 text-black border-yellow-600"
            >
              Pinned
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls Header */}
      <div className="flex items-center justify-between bg-card rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold">Multi-Stream Viewer</h2>
          <Badge variant="outline">{activeStreams.length} active</Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* Layout Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {LAYOUTS.map((layout) => (
              <Button
                key={layout.id}
                variant={currentLayout.id === layout.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentLayout(layout)}
                disabled={activeStreams.length > layout.maxStreams}
                className="h-8"
                title={layout.name}
              >
                <layout.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Audio Only Toggle */}
          <Button
            variant={audioOnlyMode ? "default" : "outline"}
            size="sm"
            onClick={() => setAudioOnlyMode(!audioOnlyMode)}
          >
            <Headphones className="w-4 h-4 mr-2" />
            Audio Only
          </Button>

          {/* Add Stream Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStreamBrowser(!showStreamBrowser)}
            disabled={activeStreams.length >= currentLayout.maxStreams}
          >
            + Add Stream
          </Button>
        </div>
      </div>

      {/* Stream Browser */}
      {showStreamBrowser && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Available Streams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStreams
                .filter((stream) => !activeStreams.includes(stream.id))
                .map((stream) => (
                  <div
                    key={stream.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addStream(stream.id)}
                  >
                    <img
                      src={stream.avatar}
                      alt={stream.streamer}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {stream.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stream.streamer} • {formatNumber(stream.viewers)}{" "}
                        viewers
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {stream.category}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stream Grid */}
      <div
        ref={containerRef}
        className={cn(
          "grid gap-4",
          currentLayout.gridCols === 1 && "grid-cols-1",
          currentLayout.gridCols === 2 && "grid-cols-1 md:grid-cols-2",
          currentLayout.gridCols === 3 &&
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {activeStreams.map((streamId, index) =>
          renderStreamTile(streamId, index)
        )}
      </div>

      {/* Empty State */}
      {activeStreams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Streams</h3>
            <p className="text-muted-foreground mb-4">
              Add streams to start watching multiple channels at once
            </p>
            <Button onClick={() => setShowStreamBrowser(true)}>
              Browse Streams
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stream Stats */}
      {activeStreams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {activeStreams.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Streams
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {formatNumber(
                  activeStreams.reduce((total, streamId) => {
                    const stream = getStreamData(streamId);
                    return total + (stream?.viewers || 0);
                  }, 0)
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Viewers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">
                {pinnedStreams.size}
              </div>
              <div className="text-sm text-muted-foreground">Pinned</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">
                {
                  new Set(
                    activeStreams
                      .map((streamId) => getStreamData(streamId)?.category)
                      .filter(Boolean)
                  ).size
                }
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
