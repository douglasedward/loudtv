import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import {
  StreamMetrics,
  StreamValidationResult,
} from "../interfaces/stream.interface";

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);
  private transcodingProcesses = new Map<string, ffmpeg.FfmpegCommand>();

  constructor(private readonly configService: ConfigService) {
    const ffmpegPath = this.configService.get<string>("FFMPEG_PATH");
    const ffprobePath = this.configService.get<string>("FFPROBE_PATH");

    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
  }

  async validateStreamQuality(
    inputUrl: string,
  ): Promise<StreamValidationResult> {
    return new Promise((resolve) => {
      const errors: string[] = [];
      let metrics: StreamMetrics | undefined;

      ffmpeg.ffprobe(inputUrl, (err, metadata) => {
        if (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error(`FFprobe error: ${errorMessage}`);
          errors.push(`Stream analysis failed: ${errorMessage}`);
          return resolve({ valid: false, errors });
        }

        try {
          const videoStream = metadata.streams.find(
            (stream) => stream.codec_type === "video",
          );
          const audioStream = metadata.streams.find(
            (stream) => stream.codec_type === "audio",
          );

          if (!videoStream) {
            errors.push("No video stream found");
          }

          if (!audioStream) {
            errors.push("No audio stream found");
          }

          if (videoStream) {
            // Validate bitrate
            const bitrate = parseInt(videoStream.bit_rate || "0", 10);
            const minBitrate =
              this.configService.get<number>("MIN_BITRATE") || 500;
            const maxBitrate =
              this.configService.get<number>("MAX_BITRATE") || 10000;

            if (bitrate < minBitrate * 1000) {
              errors.push(`Bitrate too low: ${bitrate} bps`);
            }

            if (bitrate > maxBitrate * 1000) {
              errors.push(`Bitrate too high: ${bitrate} bps`);
            }

            // Validate resolution
            const width = videoStream.width || 0;
            const height = videoStream.height || 0;

            if (width < 640 || height < 480) {
              errors.push(`Resolution too low: ${width}x${height}`);
            }

            // Validate FPS
            const fps = this.parseFps(videoStream.r_frame_rate || "0/1");
            if (fps < 15) {
              errors.push(`FPS too low: ${fps}`);
            }

            if (fps > 60) {
              errors.push(`FPS too high: ${fps}`);
            }

            metrics = {
              streamId: "", // Will be set by caller
              bitrate: Math.round(bitrate / 1000), // Convert to kbps
              fps,
              resolution: `${width}x${height}`,
              codec: videoStream.codec_name || "unknown",
              dropped_frames: 0,
              duration: parseFloat(String(metadata.format.duration || "0")),
              timestamp: new Date(),
            };
          }

          const isValid = errors.length === 0;
          resolve({
            valid: isValid,
            metrics,
            errors: errors.length > 0 ? errors : undefined,
          });
        } catch (error) {
          this.logger.error("Error processing stream metadata:", error);
          resolve({
            valid: false,
            errors: ["Failed to process stream metadata"],
          });
        }
      });
    });
  }

  async startHlsTranscoding(
    username: string,
    inputUrl: string,
    outputPath: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.stopHlsTranscoding(username);

        const hlsOutputPath = `${outputPath}/${username}/${username}_%v/index.m3u8`;
        const segmentPattern = `${outputPath}/${username}/${username}_%v/segment_%03d.ts`;

        const userDir = path.join(outputPath, username);
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }

        const command = ffmpeg(inputUrl)
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions([
            "-preset",
            "veryfast",
            "-g",
            "60",
            "-keyint_min",
            "60",
            "-sc_threshold",
            "0",
            // Map streams for 5 quality variants
            "-map",
            "0:v",
            "-map",
            "0:a",
            "-map",
            "0:v",
            "-map",
            "0:a",
            "-map",
            "0:v",
            "-map",
            "0:a",
            "-map",
            "0:v",
            "-map",
            "0:a",
            "-map",
            "0:v",
            "-map",
            "0:a",
            // 1080p variant
            "-s:v:0",
            "1920x1080",
            "-b:v:0",
            "4000k",
            "-maxrate:v:0",
            "4000k",
            "-bufsize:v:0",
            "8000k",
            // 720p variant
            "-s:v:1",
            "1280x720",
            "-b:v:1",
            "2500k",
            "-maxrate:v:1",
            "2500k",
            "-bufsize:v:1",
            "5000k",
            // 480p variant
            "-s:v:2",
            "854x480",
            "-b:v:2",
            "1000k",
            "-maxrate:v:2",
            "1000k",
            "-bufsize:v:2",
            "2000k",
            // 360p variant
            "-s:v:3",
            "640x360",
            "-b:v:3",
            "600k",
            "-maxrate:v:3",
            "600k",
            "-bufsize:v:3",
            "1200k",
            // 240p variant
            "-s:v:4",
            "426x240",
            "-b:v:4",
            "300k",
            "-maxrate:v:4",
            "300k",
            "-bufsize:v:4",
            "600k",
            // Audio bitrate for all variants
            "-b:a",
            "128k",
            // Variant stream mapping
            "-var_stream_map",
            "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3 v:4,a:4",
            // Master playlist
            "-master_pl_name",
            "master.m3u8",
            // HLS options
            "-f",
            "hls",
            "-hls_time",
            "3",
            "-hls_list_size",
            "3",
            "-hls_flags",
            "delete_segments",
            "-hls_segment_filename",
            segmentPattern,
          ])
          .output(hlsOutputPath);

        command
          .on("start", (commandLine) => {
            this.logger.log(`FFmpeg command: ${commandLine}`);
            this.logger.log(`HLS transcoding started for stream: ${username}`);
            resolve(true);
          })
          .on("progress", (progress) => {
            this.logger.debug(
              `Transcoding progress for ${username}: ${JSON.stringify(progress)}`,
            );
          })
          .on("error", (err, _stdout, stderr) => {
            this.logger.error(`HLS transcoding error for ${username}:`, err);
            this.logger.error(`FFmpeg stderr:`, stderr);
            this.stopHlsTranscoding(username);
            reject(err);
          })
          .on("end", () => {
            this.stopHlsTranscoding(username);
          });

        // Store the command so we can kill it later
        this.transcodingProcesses.set(username, command);

        command.run();
      } catch (error) {
        this.logger.error(
          `Failed to start HLS transcoding for ${username}:`,
          error,
        );
        reject(error as Error);
      }
    });
  }

  stopHlsTranscoding(username: string): void {
    const command = this.transcodingProcesses.get(username);
    if (command) {
      this.logger.log(`Stopping HLS transcoding for stream: ${username}`);
      try {
        command.kill("SIGTERM");
      } catch (error) {
        this.logger.error(`Error stopping transcoding for ${username}:`, error);
      }
      this.transcodingProcesses.delete(username);
    }

    this.cleanupHlsFiles(username);
  }

  private cleanupHlsFiles(username: string): void {
    try {
      const hlsPath =
        this.configService.get<string>("HLS_PATH") || "/app/media/hls";
      const userDir = path.join(hlsPath, username);

      if (fs.existsSync(userDir)) {
        fs.rmSync(userDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.logger.error(`Error cleaning up HLS files for ${username}:`, error);
    }
  }

  private parseFps(frameRate: string): number {
    try {
      const parts = frameRate.split("/");
      if (parts.length === 2) {
        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);
        return Math.round(numerator / denominator);
      }
      return parseInt(frameRate, 10) || 0;
    } catch {
      this.logger.warn(`Failed to parse frame rate: ${frameRate}`);
      return 0;
    }
  }

  async isHealthy(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        ffmpeg()
          .input("testsrc=duration=1:size=320x240:rate=1")
          .inputFormat("lavfi")
          .output("/dev/null")
          .outputFormat("null")
          .on("end", () => {
            resolve(true);
          })
          .on("error", (error) => {
            this.logger.error("FFmpeg health check failed:", error);
            resolve(false);
          })
          .run();
      } catch {
        this.logger.error("FFmpeg health check error");
        resolve(false);
      }
    });
  }

  getActiveTranscodings(): string[] {
    return Array.from(this.transcodingProcesses.keys());
  }

  isTranscodingActive(username: string): boolean {
    return this.transcodingProcesses.has(username);
  }
}
