import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StreamKeysController } from "./stream-keys.controller";
import { StreamKeysService } from "./stream-keys.service";
import { StreamKey } from "./entities/stream-key.entity";
import { User } from "../users/entities/user.entity";
import { EventsModule } from "../events/events.module";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([StreamKey, User]),
    EventsModule,
    MetricsModule,
  ],
  controllers: [StreamKeysController],
  providers: [StreamKeysService],
  exports: [StreamKeysService],
})
export class StreamKeysModule {}
