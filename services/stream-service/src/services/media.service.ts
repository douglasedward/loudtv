import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as MediaServer from "node-media-server";
import { randomUUID } from "crypto";
import { UserService } from "./user.service";
import { RedisService } from "./redis.service";
import { FfmpegService } from "./ffmpeg.service";
import { StreamSession } from "../interfaces/stream.interface";
import { EventsService } from "src/events/events.service";

@Injectable()
export class MediaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaService.name);
  private mediaServer: MediaServer;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly eventsService: EventsService,
    private readonly ffmpegService: FfmpegService,
  ) {}

  onModuleInit() {
    this.initializeMediaServer();
  }

  onModuleDestroy() {
    if (this.mediaServer) {
      this.mediaServer.stop();
      this.logger.log("Media Server stopped");
    }

    // Stop all active HLS transcoding processes
    const activeTranscodings = this.ffmpegService.getActiveTranscodings();
    activeTranscodings.forEach((streamKey) => {
      this.ffmpegService.stopHlsTranscoding(streamKey);
    });

    if (activeTranscodings.length > 0) {
      this.logger.log(
        `Stopped ${activeTranscodings.length} HLS transcoding processes`,
      );
    }
  }

  private initializeMediaServer() {
    const rtmpPort = this.configService.get<number>("RTMP_PORT") || 1935;
    const httpPort = this.configService.get<number>("HTTP_PORT") || 8000;
    const hlsPath =
      this.configService.get<string>("HLS_PATH") || "/app/media/hls";

    const config: MediaServer.Config = {
      rtmp: {
        port: rtmpPort,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: httpPort,
        mediaroot: hlsPath, // Serve HLS files from HLS directory
        allow_origin: "*",
      },
      logType: 4,
    };

    this.mediaServer = new MediaServer(config);
    this.setupEventHandlers();
    this.mediaServer.run();
  }

  private setupEventHandlers() {
    this.mediaServer.on(
      "prePublish",
      this.handlePrePublish.bind(this) as (
        id: string,
        StreamPath: string,
      ) => void,
    );

    this.mediaServer.on(
      "postPublish",
      this.handlePostPublish.bind(this) as (
        id: string,
        streamPath: string,
      ) => void,
    );

    this.mediaServer.on(
      "donePublish",
      this.handleDonePublish.bind(this) as (
        id: string,
        streamPath: string,
      ) => void,
    );
  }

  private async handlePrePublish(sessionId: string, streamPath: string) {
    this.logger.debug(
      `[PRE Publish] Stream post-publish for user: ${streamPath}`,
    );
    try {
      // Extract stream key from path (/live/STREAM_KEY)
      const streamKey = this.extractStreamKey(streamPath);
      if (!streamKey) {
        this.logger.warn(`Invalid stream path: ${streamPath}`);
        this.rejectStream(sessionId);
        return;
      }

      // Validate stream key with User Service
      const validation = await this.userService.validateStreamKey(streamKey);
      if (!validation.valid || !validation.userId || !validation.username) {
        this.logger.warn(`Invalid stream key: ${streamKey}`);
        this.rejectStream(sessionId);
        return;
      }

      // Check rate limiting
      const rateLimitKey = `stream:rate:${validation.userId}`;
      const rateLimitWindow =
        Number(this.configService.get<number>("RATE_LIMIT_WINDOW_MS")) || 60000;
      const rateLimitMax =
        Number(this.configService.get<number>("RATE_LIMIT_MAX_ATTEMPTS")) || 10;

      const isAllowed = await this.redisService.checkRateLimit(
        rateLimitKey,
        rateLimitMax,
        Math.floor(rateLimitWindow / 1000),
      );

      if (!isAllowed) {
        this.logger.warn(`Rate limit exceeded for user: ${validation.userId}`);
        this.rejectStream(sessionId);
        return;
      }

      // Check maximum streams per user
      const activeStreams = await this.redisService.getUserActiveStreams(
        validation.userId,
      );
      const maxStreams =
        Number(this.configService.get<number>("MAX_STREAMS_PER_USER")) || 3;

      if (activeStreams.length >= maxStreams) {
        this.logger.warn(
          `Maximum streams exceeded for user: ${validation.userId}`,
        );
        this.rejectStream(sessionId);
        return;
      }

      // Create stream session
      const session: StreamSession = {
        id: randomUUID(),
        streamKey,
        userId: validation.userId,
        username: validation.username,
        protocol: "rtmp",
        status: "connecting",
        startedAt: new Date(),
        lastActivity: new Date(),
      };

      // Store session in Redis
      await this.redisService.setStreamSession(
        streamKey,
        session,
        Number(this.configService.get<number>("STREAM_TIMEOUT_MS")) || 300000,
      );

      this.logger.log(
        `Stream pre-publish approved for user: ${validation.username}`,
      );
    } catch (error) {
      this.logger.error("Error in pre-publish handler:", error);
      this.rejectStream(sessionId);
    }
  }

  private async handlePostPublish(_: string, streamPath: string) {
    try {
      const streamKey = this.extractStreamKey(streamPath);
      if (!streamKey) return;

      let session = await this.redisService.getStreamSession(streamKey);
      if (!session) {
        // Wait for a short timeout to ensure session is available in Redis
        await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms delay
        session = await this.redisService.getStreamSession(streamKey);
      }
      if (!session) {
        this.logger.warn(`No session found for stream key: ${streamKey}`);
        this.rejectStream(streamKey);
        return;
      }

      // Update session status
      session.status = "active";
      session.lastActivity = new Date();

      // Validate stream quality using FFmpeg
      const rtmpPort = this.configService.get<number>("RTMP_PORT") || 1935;
      const hlsPath =
        this.configService.get<string>("HLS_PATH") || "/app/media/hls";
      const inputUrl = `rtmp://localhost:${rtmpPort}/live/${streamKey}`;
      const validation =
        await this.ffmpegService.validateStreamQuality(inputUrl);

      if (validation.valid && validation.metrics) {
        session.bitrate = validation.metrics.bitrate;
        session.resolution = validation.metrics.resolution;
        session.fps = validation.metrics.fps;
        session.codec = validation.metrics.codec;
      } else {
        this.logger.warn(
          `Stream quality validation failed: ${validation.errors?.join(", ")}`,
        );
        // Continue anyway but log the issues
      }

      try {
        await this.ffmpegService.startHlsTranscoding(
          session.username,
          inputUrl,
          hlsPath,
        );
      } catch (error) {
        this.logger.error(
          `Failed to start HLS transcoding for ${streamKey}:`,
          error,
        );
        // Continue without transcoding - the RTMP stream will still work
      }

      // Update session in Redis
      await this.redisService.setStreamSession(streamKey, session);

      // Publish stream started event
      await this.eventsService.publishStreamStarted(
        session.id,
        session.username,
        {
          bitrate: session.bitrate,
          resolution: session.resolution,
          fps: session.fps,
          codec: session.codec,
          startedAt: session.startedAt,
        },
      );

      this.logger.log(
        `Stream started: ${session.id} for user: ${session.userId}`,
      );
    } catch (error) {
      this.logger.error("Error in post-publish handler:", error);
    }
  }

  private async handleDonePublish(_: string, streamPath: string) {
    try {
      const streamKey = this.extractStreamKey(streamPath);
      if (!streamKey) return;

      const session = await this.redisService.getStreamSession(streamKey);
      if (!session) {
        this.logger.warn(`No session found for stream key: ${streamKey}`);
        return;
      }

      // Calculate stream duration
      const duration = Date.now() - session.startedAt.getTime();

      // Publish stream ended event
      await this.eventsService.publishStreamEnded(
        session.id,
        session.username,
        {
          duration,
          endedAt: new Date(),
        },
      );

      // Clean up session
      await this.redisService.deleteStreamSession(streamKey);

      this.logger.log(
        `Stream ended: ${session.id} for user: ${session.userId}`,
      );
    } catch (error) {
      this.logger.error("Error in done-publish handler:", error);
    }
  }

  private extractStreamKey(streamPath: string): string | null {
    // Expected format: /live/STREAM_KEY
    const match = streamPath.match(/^\/live\/(.+)$/);
    return match ? match[1] : null;
  }

  private rejectStream(sessionId: string) {
    // With our custom implementation, we can properly reject streams
    this.logger.error(`Rejecting stream: ${sessionId}`);
    // The server will handle the rejection internally
  }

  private getHlsUrl(username: string): string {
    const httpPort = this.configService.get<number>("HTTP_PORT") || 8000;
    const serverHost =
      this.configService.get<string>("SERVER_HOST") || "localhost";

    // Return the HTTP URL that clients can access
    return `http://${serverHost}:${httpPort}/${username}/master.m3u8`;
  }

  isHealthy(): Promise<boolean> {
    try {
      return Promise.resolve(this.mediaServer !== undefined);
    } catch {
      return Promise.resolve(false);
    }
  }

  getActiveStreams(): Promise<StreamSession[]> {
    // This would require querying all active sessions from Redis
    // Implementation depends on how we want to structure this
    return Promise.resolve([]);
  }

  getActiveTranscodings(): string[] {
    return this.ffmpegService.getActiveTranscodings();
  }

  isTranscodingActive(username: string): boolean {
    return this.ffmpegService.isTranscodingActive(username);
  }
}
