import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { KafkaService, KAFKA_TOPICS, EVENT_TYPES } from "@loudtv/kafka";

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    // Subscribe to events that user service needs to handle
    await this.kafkaService.subscribe(
      [KAFKA_TOPICS.STREAM_EVENTS],
      async (message, topic) => {
        await this.handleIncomingEvent(message, topic);
      },
    );
  }

  private async handleIncomingEvent(
    message: any,
    topic: string,
  ): Promise<void> {
    this.logger.debug(`Received event from ${topic}:`, message.eventType);

    try {
      switch (message.eventType) {
        case EVENT_TYPES.STREAM_STARTED:
          await this.handleStreamStarted(message.data);
          break;
        default:
          this.logger.debug(`Unhandled event type: ${message.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event ${message.eventType}:`, error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handleStreamStarted(data: any): Promise<void> {
    // Handle stream started logic
    this.logger.log(`Stream started by user: ${data.username}`);
  }

  // Publishing methods using the shared library
  async publishUserCreated(
    userId: string,
    userData: any,
    correlationId?: string,
  ): Promise<void> {
    await this.kafkaService.publishUserCreated(userId, userData, correlationId);
  }

  async publishUserUpdated(
    userId: string,
    userData: any,
    correlationId?: string,
  ): Promise<void> {
    await this.kafkaService.publishUserUpdated(userId, userData, correlationId);
  }

  async publishUserDeleted(
    userId: string,
    correlationId?: string,
  ): Promise<void> {
    await this.kafkaService.publishUserDeleted(userId, correlationId);
  }

  async publishUserFollowed(
    followerId: string,
    followingId: string,
    correlationId?: string,
  ): Promise<void> {
    await this.kafkaService.publishUserEvent(
      "user.followed",
      followerId,
      { followerId, followingId },
      correlationId,
    );
  }

  async publishUserUnfollowed(
    followerId: string,
    followingId: string,
    correlationId?: string,
  ): Promise<void> {
    await this.kafkaService.publishUserEvent(
      "user.unfollowed",
      followerId,
      { followerId, followingId },
      correlationId,
    );
  }
}
