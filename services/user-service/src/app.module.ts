import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { TerminusModule } from "@nestjs/terminus";
import { ThrottlerModule } from "@nestjs/throttler";

import { DatabaseConfig } from "./config/database.config";
import { RedisModule } from "./config/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { FollowersModule } from "./followers/followers.module";
import { StreamKeysModule } from "./stream-keys/stream-keys.module";
import { HealthModule } from "./health/health.module";
import { EventsModule } from "./events/events.module";
import { MetricsModule } from "./metrics/metrics.module";
import { CacheModule } from "./common/cache/cache.module";
import { SecurityModule } from "./common/security/security.module";
import { PerformanceModule } from "./common/performance/performance.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    RedisModule,

    // Throttling/Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || "60", 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || "100", 10),
      },
    ]),

    // Prometheus Metrics
    PrometheusModule.register({
      path: "/metrics",
      defaultMetrics: {
        enabled: true,
      },
    }),

    // Health Checks
    TerminusModule,

    // Application modules
    CacheModule,
    SecurityModule,
    PerformanceModule,
    AuthModule,
    UsersModule,
    FollowersModule,
    StreamKeysModule,
    HealthModule,
    EventsModule,
    MetricsModule,
  ],
})
export class AppModule {}
