import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { TerminusModule } from "@nestjs/terminus";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { ConfigModule } from "./config/config.module";
import { HealthController } from "./controllers/health.controller";
import { MediaService } from "./services/media.service";
import { RedisService } from "./services/redis.service";
import { UserService } from "./services/user.service";
import { FfmpegService } from "./services/ffmpeg.service";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    TerminusModule,
    PrometheusModule.register(),

    // Common modules
    EventsModule,
  ],
  controllers: [HealthController],
  providers: [MediaService, RedisService, UserService, FfmpegService],
})
export class AppModule {}
