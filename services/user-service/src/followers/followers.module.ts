import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FollowersController } from "./followers.controller";
import { FollowersService } from "./followers.service";
import { Follower } from "./entities/follower.entity";
import { User } from "@/users/entities/user.entity";
import { EventsModule } from "@/events/events.module";
import { MetricsModule } from "@/metrics/metrics.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Follower, User]),
    EventsModule,
    MetricsModule,
  ],
  controllers: [FollowersController],
  providers: [FollowersService],
  exports: [FollowersService],
})
export class FollowersModule {}
