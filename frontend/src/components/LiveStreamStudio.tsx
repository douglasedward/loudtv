"use client";

import {
  Activity,
  AlertCircle,
  BarChart3,
  Camera,
  CheckCircle,
  Circle,
  Clock,
  Layers,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  Palette,
  Play,
  Settings,
  Share2,
  Smartphone,
  Square,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";
import { useEffect, useRef,useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn, formatDuration,formatNumber } from "@/lib/utils";

interface StreamSource {
  id: string;
  name: string;
  type: "camera" | "screen" | "window" | "media" | "image";
  active: boolean;
  preview?: string;
  settings: {
    resolution: string;
    fps: number;
    bitrate: number;
    volume?: number;
  };
}

interface StreamScene {
  id: string;
  name: string;
  sources: string[];
  active: boolean;
  preview?: string;
}

interface StreamStats {
  status: "offline" | "starting" | "live" | "ending";
  viewers: number;
  duration: number;
  bitrate: number;
  fps: number;
  droppedFrames: number;
  networkHealth: "excellent" | "good" | "fair" | "poor";
  cpuUsage: number;
  memoryUsage: number;
}

interface LiveStreamStudioProps {
  streamKey?: string;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  className?: string;
}

export function LiveStreamStudio({
  streamKey,
  onStreamStart,
  onStreamStop,
  className,
}: LiveStreamStudioProps) {
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [scenes, setScenes] = useState<StreamScene[]>([]);
  const [activeScene, setActiveScene] = useState<string>("main");
  const [streamStats, setStreamStats] = useState<StreamStats>({
    status: "offline",
    viewers: 0,
    duration: 0,
    bitrate: 0,
    fps: 0,
    droppedFrames: 0,
    networkHealth: "good",
    cpuUsage: 0,
    memoryUsage: 0,
  });
  const [audioLevels, setAudioLevels] = useState<{ [key: string]: number }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ user: string; message: string; timestamp: number }>
  >([]);

  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize default sources and scenes
  useEffect(() => {
    const defaultSources: StreamSource[] = [
      {
        id: "camera",
        name: "Main Camera",
        type: "camera",
        active: true,
        settings: {
          resolution: "1920x1080",
          fps: 30,
          bitrate: 2500,
          volume: 100,
        },
      },
      {
        id: "screen",
        name: "Screen Share",
        type: "screen",
        active: false,
        settings: {
          resolution: "1920x1080",
          fps: 30,
          bitrate: 3000,
        },
      },
      {
        id: "microphone",
        name: "Microphone",
        type: "media",
        active: true,
        settings: {
          resolution: "Audio Only",
          fps: 0,
          bitrate: 128,
          volume: 85,
        },
      },
    ];

    const defaultScenes: StreamScene[] = [
      {
        id: "main",
        name: "Main Scene",
        sources: ["camera", "microphone"],
        active: true,
      },
      {
        id: "screen_share",
        name: "Screen Share",
        sources: ["screen", "microphone"],
        active: false,
      },
      {
        id: "be_right_back",
        name: "Be Right Back",
        sources: ["microphone"],
        active: false,
      },
    ];

    setSources(defaultSources);
    setScenes(defaultScenes);
  }, []);

  // Simulate stream stats updates
  useEffect(() => {
    if (streamStats.status !== "live") return;

    const interval = setInterval(() => {
      setStreamStats((prev) => ({
        ...prev,
        viewers: Math.max(
          0,
          prev.viewers + Math.floor((Math.random() - 0.4) * 10)
        ),
        duration: prev.duration + 1,
        bitrate: 2500 + Math.floor((Math.random() - 0.5) * 500),
        fps: 30 + Math.floor((Math.random() - 0.5) * 2),
        droppedFrames: prev.droppedFrames + (Math.random() > 0.9 ? 1 : 0),
        cpuUsage: Math.min(
          100,
          Math.max(0, prev.cpuUsage + (Math.random() - 0.5) * 10)
        ),
        memoryUsage: Math.min(
          100,
          Math.max(0, prev.memoryUsage + (Math.random() - 0.5) * 5)
        ),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [streamStats.status]);

  // Simulate audio levels
  useEffect(() => {
    const interval = setInterval(() => {
      const newLevels: { [key: string]: number } = {};
      sources.forEach((source) => {
        if (source.active && source.settings.volume !== undefined) {
          newLevels[source.id] = Math.random() * source.settings.volume;
        }
      });
      setAudioLevels(newLevels);
    }, 100);

    return () => clearInterval(interval);
  }, [sources]);

  // Initialize media stream for preview
  useEffect(() => {
    const initPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (previewRef.current) {
          previewRef.current.srcObject = stream;
        }

        mediaStreamRef.current = stream;
      } catch (error) {
        console.error("Failed to initialize preview:", error);
      }
    };

    initPreview();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startStream = async () => {
    setStreamStats((prev) => ({ ...prev, status: "starting" }));

    // Simulate stream startup delay
    setTimeout(() => {
      setStreamStats((prev) => ({
        ...prev,
        status: "live",
        viewers: Math.floor(Math.random() * 50) + 10,
      }));
      onStreamStart?.();
    }, 2000);
  };

  const stopStream = () => {
    setStreamStats((prev) => ({ ...prev, status: "ending" }));

    // Simulate stream ending delay
    setTimeout(() => {
      setStreamStats((prev) => ({
        ...prev,
        status: "offline",
        viewers: 0,
        duration: 0,
        droppedFrames: 0,
      }));
      onStreamStop?.();
    }, 1000);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const toggleSource = (sourceId: string) => {
    setSources((prev) =>
      prev.map((source) =>
        source.id === sourceId ? { ...source, active: !source.active } : source
      )
    );
  };

  const updateSourceVolume = (sourceId: string, volume: number) => {
    setSources((prev) =>
      prev.map((source) =>
        source.id === sourceId
          ? { ...source, settings: { ...source.settings, volume } }
          : source
      )
    );
  };

  const switchScene = (sceneId: string) => {
    setScenes((prev) =>
      prev.map((scene) => ({ ...scene, active: scene.id === sceneId }))
    );
    setActiveScene(sceneId);
  };

  const getStatusColor = () => {
    switch (streamStats.status) {
      case "live":
        return "bg-green-500";
      case "starting":
      case "ending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getNetworkHealthColor = () => {
    switch (streamStats.networkHealth) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "fair":
        return "text-yellow-500";
      case "poor":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Main Preview and Controls */}
      <div className="lg:col-span-2 space-y-6">
        {/* Stream Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Stream Preview
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div
                  className={cn("w-3 h-3 rounded-full", getStatusColor())}
                ></div>
                <Badge
                  variant={
                    streamStats.status === "live" ? "destructive" : "secondary"
                  }
                >
                  {streamStats.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={previewRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Stream Status Overlay */}
              {streamStats.status === "live" && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  LIVE
                </div>
              )}

              {/* Stream Info Overlay */}
              {streamStats.status === "live" && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs opacity-75">Viewers</div>
                      <div className="font-bold">
                        {formatNumber(streamStats.viewers)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75">Duration</div>
                      <div className="font-bold">
                        {formatDuration(streamStats.duration)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75">Bitrate</div>
                      <div className="font-bold">
                        {formatNumber(streamStats.bitrate)} kbps
                      </div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75">FPS</div>
                      <div className="font-bold">{streamStats.fps}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {(streamStats.status === "starting" ||
                streamStats.status === "ending") && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">
                      {streamStats.status === "starting"
                        ? "Starting stream..."
                        : "Ending stream..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-4">
              {streamStats.status === "offline" ? (
                <Button
                  size="lg"
                  onClick={startStream}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Streaming
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopStream}
                  disabled={
                    streamStats.status === "starting" ||
                    streamStats.status === "ending"
                  }
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Streaming
                </Button>
              )}

              <Button
                size="lg"
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
              >
                <Circle className="w-5 h-5 mr-2" />
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>

              <Button size="lg" variant="outline">
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scene Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              Scenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={cn(
                    "relative border-2 rounded-lg p-4 cursor-pointer transition-all",
                    scene.active
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => switchScene(scene.id)}
                >
                  <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-sm font-medium">{scene.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {scene.sources.length} sources
                  </div>
                  {scene.active && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      LIVE
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Stream Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Stream Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Network</span>
                <span className={getNetworkHealthColor()}>
                  {streamStats.networkHealth}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span>{Math.round(streamStats.cpuUsage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${streamStats.cpuUsage}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{Math.round(streamStats.memoryUsage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${streamStats.memoryUsage}%` }}
                />
              </div>
            </div>

            {streamStats.droppedFrames > 0 && (
              <div className="flex items-center space-x-2 text-sm text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span>{streamStats.droppedFrames} dropped frames</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm text-green-600">
              <Wifi className="w-4 h-4" />
              <span>Connection stable</span>
            </div>
          </CardContent>
        </Card>

        {/* Sources and Audio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              Sources & Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.map((source) => (
              <div key={source.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {source.type === "camera" && <Video className="w-4 h-4" />}
                    {source.type === "screen" && (
                      <Monitor className="w-4 h-4" />
                    )}
                    {source.type === "media" && <Mic className="w-4 h-4" />}
                    <span className="text-sm font-medium">{source.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={source.active ? "default" : "outline"}
                    onClick={() => toggleSource(source.id)}
                  >
                    {source.active ? (
                      source.type === "media" ? (
                        <Mic className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )
                    ) : source.type === "media" ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <VideoOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {source.active && source.settings.volume !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4" />
                      <Slider
                        value={[source.settings.volume]}
                        onValueChange={(value: number[]) =>
                          updateSourceVolume(source.id, value[0])
                        }
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs w-8">
                        {source.settings.volume}%
                      </span>
                    </div>

                    {/* Audio Level Visualization */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-75"
                        style={{ width: `${audioLevels[source.id] || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {source.settings.resolution} • {source.settings.bitrate} kbps
                  {source.settings.fps > 0 && ` • ${source.settings.fps}fps`}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {streamStats.status === "live" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Live Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {formatNumber(streamStats.viewers)}
                  </div>
                  <div className="text-xs text-muted-foreground">Viewers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {formatDuration(streamStats.duration)}
                  </div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bitrate</span>
                  <span>{formatNumber(streamStats.bitrate)} kbps</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>FPS</span>
                  <span>{streamStats.fps}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No chat messages yet
                </div>
              ) : (
                chatMessages.slice(-5).map((msg, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-blue-600">
                      {msg.user}:
                    </span>
                    <span className="ml-1">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
