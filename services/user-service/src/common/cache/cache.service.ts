import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class CacheService {
  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.redis.get(key);
    if (!value) return undefined;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serializedValue =
      typeof value === "string" ? value : JSON.stringify(value);

    if (ttl) {
      await this.redis.setex(key, ttl, serializedValue);
    } else {
      await this.redis.set(key, serializedValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.getKeysMatching(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async getKeysMatching(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });

    return new Promise((resolve, reject) => {
      stream.on("data", (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      stream.on("end", () => {
        resolve(keys);
      });

      stream.on("error", (err) => {
        reject(err);
      });
    });
  }

  // User-specific cache helpers
  async getUserProfile(userId: string): Promise<any> {
    return this.get(`user:profile:${userId}`);
  }

  async setUserProfile(
    userId: string,
    profile: any,
    ttl: number = 3600,
  ): Promise<void> {
    await this.set(`user:profile:${userId}`, profile, ttl);
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    await this.del(`user:profile:${userId}`);
  }

  // Follower cache helpers
  async getFollowers(userId: string, page: number): Promise<any> {
    return this.get(`user:followers:${userId}:page:${page}`);
  }

  async setFollowers(
    userId: string,
    page: number,
    followers: any,
    ttl: number = 1800,
  ): Promise<void> {
    await this.set(`user:followers:${userId}:page:${page}`, followers, ttl);
  }

  async invalidateFollowersCache(userId: string): Promise<void> {
    // Invalidate all follower pages for the user
    await this.delPattern(`user:followers:${userId}:*`);
    await this.delPattern(`user:following:${userId}:*`);
  }

  // Stream key cache helpers
  async getStreamKey(userId: string): Promise<any> {
    return this.get(`user:streamkey:${userId}`);
  }

  async setStreamKey(
    userId: string,
    streamKey: any,
    ttl: number = 7200,
  ): Promise<void> {
    await this.set(`user:streamkey:${userId}`, streamKey, ttl);
  }

  async invalidateStreamKey(userId: string): Promise<void> {
    await this.del(`user:streamkey:${userId}`);
  }

  // Search cache helpers
  async getSearchResults(query: string, page: number): Promise<any> {
    return this.get(`search:users:${query}:page:${page}`);
  }

  async setSearchResults(
    query: string,
    page: number,
    results: any,
    ttl: number = 900,
  ): Promise<void> {
    await this.set(`search:users:${query}:page:${page}`, results, ttl);
  }

  // Authentication cache helpers
  async getUser(identifier: string): Promise<any> {
    return this.get(`auth:user:${identifier}`);
  }

  async setUser(
    identifier: string,
    user: any,
    ttl: number = 1800,
  ): Promise<void> {
    await this.set(`auth:user:${identifier}`, user, ttl);
  }

  async invalidateUser(identifier: string): Promise<void> {
    await this.del(`auth:user:${identifier}`);
  }

  // Rate limiting helpers
  async incrementRateLimit(key: string, ttl: number = 3600): Promise<number> {
    const pipeline = this.redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttl);
    const results = await pipeline.exec();

    if (results && results[0] && results[0][1]) {
      return results[0][1] as number;
    }
    return 1;
  }

  async getRateLimit(key: string): Promise<number> {
    return (await this.get<number>(key)) || 0;
  }

  // Additional Redis-specific helpers
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redis.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<Array<T | undefined>> {
    const values = await this.redis.mget(...keys);
    return values.map((value) => {
      if (!value) return undefined;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    });
  }

  async mset(
    keyValuePairs: Array<{ key: string; value: any; ttl?: number }>,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const { key, value, ttl } of keyValuePairs) {
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      if (ttl) {
        pipeline.setex(key, ttl, serializedValue);
      } else {
        pipeline.set(key, serializedValue);
      }
    }

    await pipeline.exec();
  }

  // Live streaming specific cache methods for CDN service integration
  async cacheSegment(
    streamId: string,
    segmentId: string,
    segmentData: Buffer | string,
    ttl: number = 6,
  ): Promise<void> {
    const key = `stream:segment:${streamId}:${segmentId}`;
    await this.redis.setex(key, ttl, segmentData);
  }

  async getSegment(
    streamId: string,
    segmentId: string,
  ): Promise<Buffer | null> {
    const key = `stream:segment:${streamId}:${segmentId}`;
    const result = await this.redis.getBuffer(key);
    return result;
  }

  async cachePlaylist(
    streamId: string,
    playlistData: string,
    ttl: number = 3,
  ): Promise<void> {
    const key = `stream:playlist:${streamId}`;
    await this.redis.setex(key, ttl, playlistData);
  }

  async getPlaylist(streamId: string): Promise<string | null> {
    const key = `stream:playlist:${streamId}`;
    return await this.redis.get(key);
  }

  async invalidateStream(streamId: string): Promise<void> {
    await this.delPattern(`stream:*:${streamId}:*`);
  }
}
