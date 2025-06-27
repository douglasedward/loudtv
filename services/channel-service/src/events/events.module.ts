import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { KafkaModule } from "@loudtv/kafka";
import { EventsService } from "./events.service";
import { ChannelsModule } from "@/channels/channels.module";

@Module({
  imports: [
    ConfigModule,
    ChannelsModule,
    KafkaModule.forMicroservice("channel-service"),
  ],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
