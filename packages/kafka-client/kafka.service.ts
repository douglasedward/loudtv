/**
 * NestJS Kafka Service for Livestreaming Microservices
 * Provides a service-oriented wrapper around the Kafka client
 */
import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  KafkaClient,
  KafkaMessage,
  TopicConfig,
  KafkaClientOptions,
  KAFKA_TOPICS,
  EVENT_TYPES,
} from "./kafka-client";
import { KafkaModuleOptions } from "./kafka.module";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafkaClient!: KafkaClient;
  private readonly serviceName: string;

  constructor(
    @Inject("KAFKA_OPTIONS") private readonly options: KafkaModuleOptions,
    private readonly configService?: ConfigService
  ) {
    this.serviceName = options.clientId;
    this.initializeKafkaClient();
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private initializeKafkaClient(): void {
    let clientOptions: KafkaClientOptions;

    if (this.options.useConfigService && this.configService) {
      // Use ConfigService for configuration
      clientOptions = {
        clientId: this.options.clientId,
        groupId: this.options.groupId,
        brokers: this.options.brokers || [
          this.configService.get("KAFKA_BROKER", "kafka:9092"),
        ],
        retry: {
          initialRetryTime: this.configService.get(
            "KAFKA_RETRY_INITIAL_TIME",
            100
          ),
          retries: this.configService.get("KAFKA_RETRY_COUNT", 8),
        },
        connectionTimeout: this.configService.get(
          "KAFKA_CONNECTION_TIMEOUT",
          3000
        ),
        requestTimeout: this.configService.get("KAFKA_REQUEST_TIMEOUT", 30000),
        ssl: this.configService.get("KAFKA_SSL_ENABLED", false),
        ...this.options.options,
      };

      // Add SASL configuration if enabled
      if (this.configService.get("KAFKA_SASL_ENABLED", false)) {
        clientOptions.sasl = {
          mechanism: this.configService.get(
            "KAFKA_SASL_MECHANISM",
            "plain"
          ) as "plain",
          username: this.configService.get("KAFKA_SASL_USERNAME") || "",
          password: this.configService.get("KAFKA_SASL_PASSWORD") || "",
        };
      }
    } else {
      // Use provided options
      clientOptions = {
        clientId: this.options.clientId,
        groupId: this.options.groupId,
        brokers: this.options.brokers || ["kafka:9092"],
        ...this.options.options,
      };
    }

    this.kafkaClient = new KafkaClient(clientOptions);
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    try {
      await this.kafkaClient.connect();
      this.logger.log(`✅ Kafka service connected for ${this.serviceName}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to connect Kafka service for ${this.serviceName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    try {
      await this.kafkaClient.disconnect();
      this.logger.log(`Kafka service disconnected for ${this.serviceName}`);
    } catch (error) {
      this.logger.error(
        `Error disconnecting Kafka service for ${this.serviceName}:`,
        error
      );
    }
  }

  /**
   * Publish an event to a topic
   */
  async publishEvent<T = any>(
    topic: string,
    eventType: string,
    data: T,
    options?: {
      key?: string;
      correlationId?: string;
      userId?: string;
      sessionId?: string;
      headers?: Record<string, string>;
    }
  ): Promise<void> {
    const message: KafkaMessage<T> = {
      eventId: this.generateEventId(),
      eventType,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      version: "1.0",
      data,
      correlationId: options?.correlationId,
      userId: options?.userId,
      sessionId: options?.sessionId,
    };

    const topicConfig: TopicConfig = {
      topic,
      key: options?.key,
      headers: options?.headers,
    };

    await this.kafkaClient.publish(topicConfig, message);
  }

  /**
   * Subscribe to topics and handle messages
   */
  async subscribe(
    topics: string[],
    handler: (message: KafkaMessage, topic: string) => Promise<void>
  ): Promise<void> {
    await this.kafkaClient.subscribe(topics, async (message, topic) => {
      try {
        await handler(message, topic);
      } catch (error) {
        this.logger.error(`Error handling message from ${topic}:`, error);
        // Could implement dead letter queue here
      }
    });
  }

  // Convenience methods for common event types

  /**
   * Publish User Events
   */
  async publishUserEvent<T = any>(
    eventType: string,
    userId: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    await this.publishEvent(
      KAFKA_TOPICS.USER_EVENTS,
      eventType,
      { userId, ...data },
      { key: userId, correlationId, userId }
    );
  }

  async publishUserCreated(
    userId: string,
    userData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishUserEvent(
      EVENT_TYPES.USER_CREATED,
      userId,
      userData,
      correlationId
    );
  }

  async publishUserUpdated(
    userId: string,
    userData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishUserEvent(
      EVENT_TYPES.USER_UPDATED,
      userId,
      userData,
      correlationId
    );
  }

  async publishUserDeleted(
    userId: string,
    correlationId?: string
  ): Promise<void> {
    await this.publishUserEvent(
      EVENT_TYPES.USER_DELETED,
      userId,
      {},
      correlationId
    );
  }

  /**
   * Publish Channel Events
   */
  async publishChannelEvent<T = any>(
    eventType: string,
    channelId: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    await this.publishEvent(
      KAFKA_TOPICS.CHANNEL_EVENTS,
      eventType,
      { channelId, ...data },
      { key: channelId, correlationId }
    );
  }

  async publishChannelCreated(
    channelId: string,
    channelData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishChannelEvent(
      EVENT_TYPES.CHANNEL_CREATED,
      channelId,
      channelData,
      correlationId
    );
  }

  async publishChannelUpdated(
    channelId: string,
    channelData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishChannelEvent(
      EVENT_TYPES.CHANNEL_UPDATED,
      channelId,
      channelData,
      correlationId
    );
  }

  async publishChannelDeleted(
    channelId: string,
    correlationId?: string
  ): Promise<void> {
    await this.publishChannelEvent(
      EVENT_TYPES.CHANNEL_DELETED,
      channelId,
      {},
      correlationId
    );
  }

  /**
   * Publish Stream Events
   */
  async publishStreamEvent<T = any>(
    eventType: string,
    streamId: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    await this.publishEvent(
      KAFKA_TOPICS.STREAM_EVENTS,
      eventType,
      { streamId, ...data },
      { key: streamId, correlationId }
    );
  }

  async publishStreamStarted(
    streamId: string,
    streamData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishStreamEvent(
      EVENT_TYPES.STREAM_STARTED,
      streamId,
      streamData,
      correlationId
    );
  }

  async publishStreamEnded(
    streamId: string,
    streamData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishStreamEvent(
      EVENT_TYPES.STREAM_ENDED,
      streamId,
      streamData,
      correlationId
    );
  }

  async publishViewerJoined(
    streamId: string,
    viewerData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishStreamEvent(
      EVENT_TYPES.VIEWER_JOINED,
      streamId,
      viewerData,
      correlationId
    );
  }

  async publishViewerLeft(
    streamId: string,
    viewerData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishStreamEvent(
      EVENT_TYPES.VIEWER_LEFT,
      streamId,
      viewerData,
      correlationId
    );
  }

  /**
   * Publish Chat Events
   */
  async publishChatEvent<T = any>(
    eventType: string,
    channelId: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    await this.publishEvent(
      KAFKA_TOPICS.CHAT_EVENTS,
      eventType,
      { channelId, ...data },
      { key: channelId, correlationId }
    );
  }

  async publishChatMessage(
    channelId: string,
    messageData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishChatEvent(
      EVENT_TYPES.CHAT_MESSAGE_SENT,
      channelId,
      messageData,
      correlationId
    );
  }

  async publishChatModeration(
    channelId: string,
    moderationData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishChatEvent(
      EVENT_TYPES.CHAT_USER_TIMEOUT,
      channelId,
      moderationData,
      correlationId
    );
  }

  /**
   * Publish Payment Events
   */
  async publishPaymentEvent<T = any>(
    eventType: string,
    paymentId: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    await this.publishEvent(
      KAFKA_TOPICS.PAYMENT_EVENTS,
      eventType,
      { paymentId, ...data },
      { key: paymentId, correlationId }
    );
  }

  async publishPaymentCompleted(
    paymentId: string,
    paymentData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishPaymentEvent(
      EVENT_TYPES.PAYMENT_COMPLETED,
      paymentId,
      paymentData,
      correlationId
    );
  }

  async publishDonationReceived(
    donationId: string,
    donationData: any,
    correlationId?: string
  ): Promise<void> {
    await this.publishPaymentEvent(
      EVENT_TYPES.DONATION_RECEIVED,
      donationId,
      donationData,
      correlationId
    );
  }

  /**
   * Publish Analytics Events
   */
  async publishAnalyticsEvent<T = any>(
    eventType: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    await this.publishEvent(KAFKA_TOPICS.ANALYTICS_EVENTS, eventType, data, {
      correlationId,
    });
  }

  /**
   * Publish System Events
   */
  async publishSystemEvent<T = any>(
    eventType: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    await this.publishEvent(
      KAFKA_TOPICS.SYSTEM_EVENTS,
      eventType,
      { service: this.serviceName, ...data },
      { key: this.serviceName, correlationId }
    );
  }

  async publishSystemStartup(metadata: any = {}): Promise<void> {
    await this.publishSystemEvent(EVENT_TYPES.SYSTEM_STARTUP, {
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  async publishSystemShutdown(metadata: any = {}): Promise<void> {
    await this.publishSystemEvent(EVENT_TYPES.SYSTEM_SHUTDOWN, {
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  async publishHealthCheck(
    status: "healthy" | "unhealthy",
    details: any = {}
  ): Promise<void> {
    await this.publishSystemEvent(EVENT_TYPES.SYSTEM_HEALTH_CHECK, {
      status,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    return this.kafkaClient.healthCheck();
  }

  /**
   * Get status
   */
  getStatus(): any {
    return this.kafkaClient.getStatus();
  }

  /**
   * Get the underlying Kafka client (for advanced usage)
   */
  getKafkaClient(): KafkaClient {
    return this.kafkaClient;
  }

  /**
   * Create topics (for development/testing)
   */
  async createTopics(
    topics: Array<{
      topic: string;
      numPartitions?: number;
      replicationFactor?: number;
    }>
  ): Promise<void> {
    await this.kafkaClient.createTopics(topics);
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}

export { KAFKA_TOPICS, EVENT_TYPES } from "./kafka-client";
