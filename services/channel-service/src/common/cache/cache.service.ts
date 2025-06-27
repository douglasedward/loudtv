import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class CacheService {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redis: Redis,
    private readonly configService: ConfigService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        const defaultTtl = this.configService.get("CACHE_TTL_SHORT", 300);
        await this.redis.setex(key, defaultTtl, serializedValue);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(
        `Cache delete pattern error for pattern ${pattern}:`,
        error
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);

      if (ttlSeconds && value === 1) {
        await this.redis.expire(key, ttlSeconds);
      }

      return value;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async setHash(
    key: string,
    field: string,
    value: any,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);

      if (ttlSeconds) {
        await this.redis.expire(key, ttlSeconds);
      }
    } catch (error) {
      console.error(
        `Cache setHash error for key ${key}, field ${field}:`,
        error
      );
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(
        `Cache getHash error for key ${key}, field ${field}:`,
        error
      );
      return null;
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T> | null> {
    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error(`Cache getAllHash error for key ${key}:`, error);
      return null;
    }
  }

  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `channel-service:${prefix}:${parts.join(":")}`;
  }
}
