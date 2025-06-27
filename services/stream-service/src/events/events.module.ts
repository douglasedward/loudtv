import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { KafkaModule } from "@loudtv/kafka";
import { EventsService } from "./events.service";

@Module({
  imports: [ConfigModule, KafkaModule.forMicroservice("stream-service")],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
