"use client";

import {
  Loader2,
  Maximize,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StreamQuality {
  label: string;
  resolution: string;
  bitrate: number;
  url: string;
}

interface AdvancedVideoPlayerProps {
  streamUrl?: string;
  poster?: string;
  qualities?: StreamQuality[];
  title?: string;
  isLive?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onQualityChange?: (quality: StreamQuality) => void;
}

export function AdvancedVideoPlayer({
  streamUrl,
  poster,
  qualities = [],
  title,
  isLive = false,
  className,
  onPlay,
  onPause,
  onQualityChange,
}: AdvancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<StreamQuality | null>(
    qualities[0] || null
  );
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hlsQualities, setHlsQualities] = useState<StreamQuality[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [onPlay, onPause]);

  // HLS initialization and management
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // Check if the stream URL is an HLS stream
    const isHLSStream = streamUrl.includes(".m3u8");

    if (isHLSStream) {
      if (Hls.isSupported()) {
        // Initialize HLS.js
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: isLive,
          backBufferLength: isLive ? 4 : 30,
          maxBufferLength: isLive ? 10 : 30,
          maxMaxBufferLength: isLive ? 20 : 60,
          liveSyncDurationCount: isLive ? 3 : undefined,
          liveMaxLatencyDurationCount: isLive ? 5 : undefined,
        });

        hlsRef.current = hls;

        // Load the stream
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        // Handle HLS events
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS manifest parsed");
          // Auto-extract quality levels if not provided
          if (hls.levels.length > 0) {
            const detectedQualities: StreamQuality[] = hls.levels.map(
              (level, index) => ({
                label: `${level.height}p`,
                resolution: `${level.width}x${level.height}`,
                bitrate: level.bitrate,
                url: streamUrl, // Same URL, different quality levels handled by HLS
              })
            );

            // Add "Auto" quality option for HLS adaptive streaming
            const autoQuality: StreamQuality = {
              label: "Auto",
              resolution: "Adaptive",
              bitrate: 0,
              url: streamUrl,
            };

            setHlsQualities([autoQuality, ...detectedQualities]);

            // Set initial quality to Auto if no quality was previously selected
            if (!selectedQuality) {
              setSelectedQuality(autoQuality);
            }
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Network error - attempting to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media error - attempting to recover...");
                hls.recoverMediaError();
                break;
              default:
                console.log("Unrecoverable error - destroying HLS instance");
                hls.destroy();
                break;
            }
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log("Quality level switched to:", data.level);
          if (onQualityChange && hls.levels[data.level]) {
            const level = hls.levels[data.level];
            onQualityChange({
              label: `${level.height}p`,
              resolution: `${level.width}x${level.height}`,
              bitrate: level.bitrate,
              url: streamUrl,
            });
          }
        });

        return () => {
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // For Safari and other browsers with native HLS support
        video.src = streamUrl;
      } else {
        console.error("HLS is not supported in this browser");
      }
    } else {
      // For non-HLS streams, use regular video src
      video.src = streamUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, isLive, qualities.length, onQualityChange]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetTimeout);
      container.addEventListener("mouseenter", resetTimeout);
      container.addEventListener("mouseleave", () => {
        if (isPlaying) {
          timeout = setTimeout(() => setShowControls(false), 1000);
        }
      });
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener("mousemove", resetTimeout);
        container.removeEventListener("mouseenter", resetTimeout);
        container.removeEventListener("mouseleave", () => {});
      }
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || isLive) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const handleVolumeClick = (e: React.MouseEvent) => {
    const video = videoRef.current;
    const volumeBar = volumeRef.current;
    if (!video || !volumeBar) return;

    const rect = volumeBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, pos));
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video || isLive) return;

    video.currentTime = Math.max(
      0,
      Math.min(duration, video.currentTime + seconds)
    );
  };

  const changeQuality = (quality: StreamQuality) => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (!video) return;

    if (hls && hls.levels.length > 0) {
      // For HLS streams, change quality level
      if (quality.label === "Auto") {
        // Enable automatic quality selection
        hls.currentLevel = -1;
      } else {
        const levelIndex = hls.levels.findIndex(
          (level) => `${level.height}p` === quality.label
        );

        if (levelIndex !== -1) {
          hls.currentLevel = levelIndex;
        }
      }

      setSelectedQuality(quality);
      onQualityChange?.(quality);
    } else {
      // For non-HLS streams, change source URL
      const currentTime = video.currentTime;
      setSelectedQuality(quality);
      video.src = quality.url;
      video.currentTime = currentTime;
      onQualityChange?.(quality);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        src={
          streamUrl && !streamUrl.includes(".m3u8")
            ? streamUrl || selectedQuality?.url
            : undefined
        }
        onClick={togglePlayPause}
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
          ● LIVE
        </div>
      )}

      {/* Title Overlay */}
      {title && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-sm max-w-xs truncate">
          {title}
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        {!isLive && (
          <div
            ref={progressRef}
            className="h-2 bg-white/20 cursor-pointer mx-4 mb-2"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            {!isLive && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => skip(-10)}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => skip(10)}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div
                ref={volumeRef}
                className="w-20 h-1 bg-white/20 cursor-pointer"
                onClick={handleVolumeClick}
              >
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>

            {/* Time Display */}
            {!isLive && (
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Settings */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>

              {showSettings && (
                <Card className="absolute bottom-full right-0 mb-2 w-48">
                  <CardContent className="p-3 space-y-3">
                    {/* Quality Settings */}
                    {(qualities.length > 0 || hlsQualities.length > 0) && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Quality</h4>
                        <div className="space-y-1">
                          {/* Show HLS-detected qualities first (includes Auto option) */}
                          {hlsQualities.map((quality) => (
                            <button
                              key={quality.label}
                              className={cn(
                                "w-full text-left px-2 py-1 rounded text-sm",
                                selectedQuality?.label === quality.label
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                              onClick={() => changeQuality(quality)}
                            >
                              {quality.label}
                              {quality.label !== "Auto" && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({quality.resolution})
                                </span>
                              )}
                            </button>
                          ))}
                          {/* Show provided qualities if no HLS qualities detected */}
                          {hlsQualities.length === 0 &&
                            qualities.map((quality) => (
                              <button
                                key={quality.label}
                                className={cn(
                                  "w-full text-left px-2 py-1 rounded text-sm",
                                  selectedQuality?.label === quality.label
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                )}
                                onClick={() => changeQuality(quality)}
                              >
                                {quality.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Playback Speed */}
                    {!isLive && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Speed</h4>
                        <div className="space-y-1">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              className={cn(
                                "w-full text-left px-2 py-1 rounded text-sm",
                                playbackRate === rate
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                              onClick={() => changePlaybackRate(rate)}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
