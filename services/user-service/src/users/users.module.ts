import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { EventsModule } from "../events/events.module";
import { MetricsModule } from "../metrics/metrics.module";
import { CacheModule } from "../common/cache/cache.module";
import { SecurityModule } from "../common/security/security.module";
import { PerformanceModule } from "../common/performance/performance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EventsModule,
    MetricsModule,
    CacheModule,
    SecurityModule,
    PerformanceModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
