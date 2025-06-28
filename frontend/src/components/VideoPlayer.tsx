"use client";

import Hls from "hls.js";
import {
  Loader2,
  Maximize,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";
import { useStreamStore } from "@/store";

interface VideoPlayerProps {
  streamUrl?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  onViewerJoin?: () => void;
  onViewerLeave?: () => void;
}

export function VideoPlayer({
  streamUrl,
  poster,
  className,
  autoPlay = false,
  onViewerJoin,
  onViewerLeave,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<
    Array<{ height: number; bitrate: number; name: string }>
  >([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 for auto

  const { volume, isMuted, setVolume, setMuted, setFullscreen } =
    useStreamStore();

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveBackBufferLength: 0,
        liveMaxLatencyDuration: 5,
        liveSyncDuration: 1,
        maxLiveSyncPlaybackRate: 1.5,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        const levels = hls.levels.map((level) => ({
          height: level.height,
          bitrate: level.bitrate,
          name: `${level.height}p`,
        }));
        setQualities(levels);

        if (autoPlay) {
          video.play().catch(console.error);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        setIsLoading(false);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      onViewerJoin?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onViewerLeave?.();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [onViewerJoin, onViewerLeave]);

  // Handle volume changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setMuted(false);
      videoRef.current.muted = false;
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      videoRef.current.requestFullscreen();
      setFullscreen(true);
    }
  };

  const changeQuality = (qualityIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityIndex;
      setCurrentQuality(qualityIndex);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    const timeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
    return () => clearTimeout(timeout);
  };

  if (!streamUrl) {
    return (
      <div
        className={cn(
          "relative aspect-video bg-gray-900 rounded-lg flex items-center justify-center",
          className
        )}
      >
        <div className="text-center text-white">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Stream not available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video bg-black rounded-lg overflow-hidden group",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        muted={isMuted}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={togglePlay}
            size="lg"
            className="rounded-full w-20 h-20 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </Button>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        {duration > 0 && (
          <div className="mb-4">
            <div className="bg-white bg-opacity-20 rounded-full h-1">
              <div
                className="bg-red-500 h-1 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={togglePlay}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleMute}
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {duration > 0 && (
              <span className="text-white text-sm">
                {formatDuration(Math.floor(currentTime))} /{" "}
                {formatDuration(Math.floor(duration))}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Quality Selector */}
            {qualities.length > 0 && (
              <div className="relative group/quality">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg p-2 opacity-0 group-hover/quality:opacity-100 transition-opacity">
                  <div className="text-white text-sm mb-2">Quality</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => changeQuality(-1)}
                      className={cn(
                        "block w-full text-left px-3 py-1 text-sm rounded hover:bg-white hover:bg-opacity-20",
                        currentQuality === -1 ? "text-red-500" : "text-white"
                      )}
                    >
                      Auto
                    </button>
                    {qualities.map((quality, index) => (
                      <button
                        key={index}
                        onClick={() => changeQuality(index)}
                        className={cn(
                          "block w-full text-left px-3 py-1 text-sm rounded hover:bg-white hover:bg-opacity-20",
                          currentQuality === index
                            ? "text-red-500"
                            : "text-white"
                        )}
                      >
                        {quality.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={toggleFullscreen}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
