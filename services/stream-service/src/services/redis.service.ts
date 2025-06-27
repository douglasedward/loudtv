import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { StreamSession } from "../interfaces/stream.interface";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>("REDIS_HOST"),
      port: this.configService.get<number>("REDIS_PORT"),
      password: this.configService.get<string>("REDIS_PASSWORD"),
      db: this.configService.get<number>("REDIS_DB"),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on("connect", () => {
      this.logger.log("Connected to Redis");
    });

    this.redis.on("error", (error) => {
      this.logger.error("Redis connection error:", error);
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  // Session Management
  async setStreamSession(
    streamKey: string,
    session: StreamSession,
    ttl = 3600,
  ): Promise<void> {
    try {
      await this.redis.setex(
        `stream:session:${streamKey}`,
        ttl,
        JSON.stringify(session),
      );
      this.logger.debug(`Stored stream session for key: ${streamKey}`);
    } catch (error) {
      this.logger.error("Failed to store stream session:", error);
      throw error;
    }
  }

  async getStreamSession(streamKey: string): Promise<StreamSession | null> {
    try {
      const data = await this.redis.get(`stream:session:${streamKey}`);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as StreamSession;
    } catch (error) {
      this.logger.error("Failed to get stream session:", error);
      return null;
    }
  }

  async deleteStreamSession(streamKey: string): Promise<void> {
    try {
      await this.redis.del(`stream:session:${streamKey}`);
      this.logger.debug(`Deleted stream session for key: ${streamKey}`);
    } catch (error) {
      this.logger.error("Failed to delete stream session:", error);
    }
  }

  async getUserActiveStreams(userId: string): Promise<string[]> {
    try {
      const keys = await this.redis.keys("stream:session:*");
      const activeStreams: string[] = [];

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData) as StreamSession;
          if (session.userId === userId && session.status === "active") {
            activeStreams.push(session.streamKey);
          }
        }
      }

      return activeStreams;
    } catch (error) {
      this.logger.error("Failed to get user active streams:", error);
      return [];
    }
  }

  // Rate Limiting
  async checkRateLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<boolean> {
    try {
      const current = await this.redis.incr(`rate:${key}`);
      if (current === 1) {
        await this.redis.expire(`rate:${key}`, window);
      }
      return current <= limit;
    } catch (error) {
      this.logger.error("Failed to check rate limit:", error);
      return false;
    }
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === "PONG";
    } catch (error) {
      this.logger.error("Redis health check failed:", error);
      return false;
    }
  }
}
