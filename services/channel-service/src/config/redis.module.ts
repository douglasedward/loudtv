import { Module, Global, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const logger = new Logger("RedisConfig");

@Global()
@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD"),
          db: configService.get("REDIS_DB", 1),
          retryStrategy: (times) => {
            const delay = Math.min(times * 100, 3000); // Exponential backoff
            return delay;
          },
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 10000,
          commandTimeout: 5000,
        });

        redis.on("connect", () => {
          logger.log("✅ Redis connected successfully");
        });

        redis.on("error", (error) => {
          logger.error("❌ Redis connection error:", error);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ["REDIS_CLIENT"],
})
export class RedisModule {}
