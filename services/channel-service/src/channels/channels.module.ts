import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  makeCounterProvider,
  makeGaugeProvider,
} from "@willsoto/nestjs-prometheus";
import { ChannelsController } from "./channels.controller";
import { ChannelsService } from "./channels.service";
import { Channel, ChannelSchema } from "./schemas/channel.schema";
import { CacheModule } from "../common/cache/cache.module";
import { SecurityModule } from "../common/security/security.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Channel.name, schema: ChannelSchema }]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: configService.get("JWT_EXPIRATION", "7d") },
      }),
      inject: [ConfigService],
    }),
    CacheModule,
    SecurityModule,
  ],
  controllers: [ChannelsController],
  providers: [
    ChannelsService,
    makeCounterProvider({
      name: "channels_created_total",
      help: "Total number of channels created",
      labelNames: ["category"],
    }),
    makeCounterProvider({
      name: "streams_started_total",
      help: "Total number of streams started",
      labelNames: ["category"],
    }),
    makeGaugeProvider({
      name: "active_streams_gauge",
      help: "Number of currently active streams",
    }),
  ],
  exports: [ChannelsService],
})
export class ChannelsModule {}
