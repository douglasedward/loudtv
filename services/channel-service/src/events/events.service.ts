import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  KafkaService,
  KAFKA_TOPICS,
  KafkaMessage,
  EVENT_TYPES,
} from "@loudtv/kafka";
import { ChannelsService } from "../channels/channels.service";

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly channelsService: ChannelsService
  ) {}

  async onModuleInit() {
    // Subscribe to events that channel service needs to handle
    await this.kafkaService.subscribe(
      [KAFKA_TOPICS.USER_EVENTS, KAFKA_TOPICS.STREAM_EVENTS],
      async (message, topic) => {
        await this.handleIncomingEvent(message, topic);
      }
    );
  }

  private async handleIncomingEvent(
    message: KafkaMessage,
    topic: string
  ): Promise<void> {
    this.logger.debug(`Received event from ${topic}:`, message.eventType);

    try {
      switch (message.eventType) {
        case EVENT_TYPES.USER_CREATED:
          await this.handleUserCreated(message.data);
          break;
        case EVENT_TYPES.STREAM_STARTED:
          await this.handleStreamStarted(message.data);
          break;
        case EVENT_TYPES.STREAM_ENDED:
          await this.handleStreamEnded(message.data);
          break;
        default:
          this.logger.debug(`Unhandled event type: ${message.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event ${message.eventType}:`, error);
    }
  }

  private async handleUserCreated(data: any): Promise<void> {
    // TODO - Handle user created logic (create default channel settings)
    this.logger.log(`User created: ${data.userId}`);
  }

  private async handleStreamStarted(data: any): Promise<void> {
    try {
      await this.channelsService.startStream(data.streamId, data.username, {
        bitrate: data.bitrate || 0,
        resolution: data.resolution || "720p",
        fps: data.fps || 30,
        codec: data.codec || "h260",
        startedAt: data.startedAt || new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to handle stream start:`, error);
    }
  }

  private async handleStreamEnded(data: any): Promise<void> {
    try {
      await this.channelsService.endStream(data.username, {
        duration: data.duration,
        endedAt: data.endedAt,
      });
    } catch (error) {
      this.logger.error(`Failed to handle stream ended:`, error);
    }
  }

  // Channel event publishing methods
  async publishChannelCreated(
    channelId: string,
    userId: string,
    channelData: any,
    correlationId?: string
  ): Promise<void> {
    await this.kafkaService.publishChannelCreated(
      channelId,
      { ...channelData, userId },
      correlationId
    );
  }

  async publishChannelUpdated(
    channelId: string,
    userId: string,
    changes: any,
    correlationId?: string
  ): Promise<void> {
    await this.kafkaService.publishChannelUpdated(
      channelId,
      { ...changes, userId },
      correlationId
    );
  }

  async publishChannelDeleted(
    channelId: string,
    userId: string,
    correlationId?: string
  ): Promise<void> {
    await this.kafkaService.publishChannelDeleted(channelId, correlationId);
  }
}
