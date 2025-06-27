/**
 * Kafka Client for LoudTV
 */
import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig,
  ProducerConfig,
  ConsumerConfig,
} from "kafkajs";
import { Logger } from "@nestjs/common";

export interface KafkaEventBase {
  eventId: string;
  eventType: (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES] | string;
  source: string;
  timestamp: string;
  version: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

export interface KafkaMessage<T = any> extends KafkaEventBase {
  data: T;
  metadata?: Record<string, any>;
}

export interface KafkaClientOptions {
  clientId: string;
  groupId?: string;
  brokers: string[];
  retry?: {
    initialRetryTime?: number;
    retries?: number;
  };
  connectionTimeout?: number;
  requestTimeout?: number;
  ssl?: boolean;
  sasl?: {
    mechanism: "plain" | "scram-sha-256" | "scram-sha-512";
    username: string;
    password: string;
  };
}

export interface ProducerOptions {
  maxInFlightRequests?: number;
  idempotent?: boolean;
  transactionTimeout?: number;
  retry?: {
    initialRetryTime?: number;
    retries?: number;
  };
}

export interface ConsumerOptions {
  groupId: string;
  sessionTimeout?: number;
  rebalanceTimeout?: number;
  heartbeatInterval?: number;
  maxBytesPerPartition?: number;
  minBytes?: number;
  maxBytes?: number;
  maxWaitTimeInMs?: number;
  retry?: {
    initialRetryTime?: number;
    retries?: number;
  };
}

export interface TopicConfig {
  topic: string;
  partition?: number;
  key?: string;
  headers?: Record<string, string>;
}

export class KafkaClient {
  private readonly logger = new Logger(KafkaClient.name);
  private readonly kafka: Kafka;
  private producer?: Producer;
  private consumer?: Consumer;
  private isConnected = false;
  private readonly clientId: string;
  private readonly groupId?: string;

  constructor(private readonly options: KafkaClientOptions) {
    this.clientId = options.clientId;
    this.groupId = options.groupId;

    const kafkaConfig: KafkaConfig = {
      clientId: options.clientId,
      brokers: options.brokers,
      connectionTimeout: options.connectionTimeout || 3000,
      requestTimeout: options.requestTimeout || 30000,
      retry: {
        initialRetryTime: options.retry?.initialRetryTime || 100,
        retries: options.retry?.retries || 8,
      },
    };

    if (options.ssl) {
      kafkaConfig.ssl = options.ssl;
    }

    if (options.sasl) {
      kafkaConfig.sasl = {
        mechanism: options.sasl.mechanism,
        username: options.sasl.username,
        password: options.sasl.password,
      } as any;
    }

    this.kafka = new Kafka(kafkaConfig);
  }

  /**
   * Initialize the Kafka client (connect producer and consumer)
   */
  async connect(
    producerOptions?: ProducerOptions,
    consumerOptions?: ConsumerOptions
  ): Promise<void> {
    try {
      this.logger.log(`Connecting Kafka client: ${this.clientId}`);

      // Initialize producer
      const producerConfig: ProducerConfig = {
        maxInFlightRequests: producerOptions?.maxInFlightRequests || 1,
        idempotent: producerOptions?.idempotent || true,
        transactionTimeout: producerOptions?.transactionTimeout || 30000,
        retry: {
          initialRetryTime: producerOptions?.retry?.initialRetryTime || 100,
          retries: producerOptions?.retry?.retries || 8,
        },
      };

      this.producer = this.kafka.producer(producerConfig);
      await this.producer.connect();

      // Initialize consumer if groupId is provided
      if (this.groupId) {
        const consumerConfig: ConsumerConfig = {
          groupId: consumerOptions?.groupId || this.groupId,
          sessionTimeout: consumerOptions?.sessionTimeout || 30000,
          rebalanceTimeout: consumerOptions?.rebalanceTimeout || 60000,
          heartbeatInterval: consumerOptions?.heartbeatInterval || 3000,
          maxBytesPerPartition:
            consumerOptions?.maxBytesPerPartition || 1048576,
          minBytes: consumerOptions?.minBytes || 1,
          maxBytes: consumerOptions?.maxBytes || 10485760,
          maxWaitTimeInMs: consumerOptions?.maxWaitTimeInMs || 5000,
          retry: {
            initialRetryTime: consumerOptions?.retry?.initialRetryTime || 100,
            retries: consumerOptions?.retry?.retries || 8,
          },
        };

        this.consumer = this.kafka.consumer(consumerConfig);
        await this.consumer.connect();
      }

      this.isConnected = true;
      this.logger.log(`✅ Kafka client connected: ${this.clientId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to connect Kafka client: ${this.clientId}`,
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
      this.logger.log(`Disconnecting Kafka client: ${this.clientId}`);

      if (this.producer) {
        await this.producer.disconnect();
      }

      if (this.consumer) {
        await this.consumer.disconnect();
      }

      this.isConnected = false;
      this.logger.log(`Kafka client disconnected: ${this.clientId}`);
    } catch (error) {
      this.logger.error(
        `Error disconnecting Kafka client: ${this.clientId}`,
        error
      );
    }
  }

  /**
   * Publish a message to a topic
   */
  async publish<T = any>(
    topicConfig: TopicConfig,
    message: KafkaMessage<T>
  ): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error("Kafka producer not connected");
    }

    try {
      const enrichedMessage = {
        ...message,
        eventId: message.eventId || this.generateEventId(),
        timestamp: message.timestamp || new Date().toISOString(),
        version: message.version || "1.0",
        source: message.source || this.clientId,
      };

      const result = await this.producer.send({
        topic: topicConfig.topic,
        messages: [
          {
            key: topicConfig.key || enrichedMessage.eventId,
            value: JSON.stringify(enrichedMessage),
            partition: topicConfig.partition,
            headers: {
              "content-type": "application/json",
              "event-type": enrichedMessage.eventType,
              source: enrichedMessage.source,
              "correlation-id": enrichedMessage.correlationId || "",
              ...topicConfig.headers,
            },
          },
        ],
      });

      this.logger.debug(`📤 Published message to ${topicConfig.topic}:`, {
        eventType: enrichedMessage.eventType,
        eventId: enrichedMessage.eventId,
        partition: result[0].partition,
        offset: result[0].baseOffset,
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish message to ${topicConfig.topic}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Subscribe to topics and consume messages
   */
  async subscribe(
    topics: string[],
    handler: (
      message: KafkaMessage,
      topic: string,
      partition: number,
      offset: string
    ) => Promise<void>
  ): Promise<void> {
    if (!this.consumer || !this.isConnected) {
      throw new Error("Kafka consumer not connected");
    }

    try {
      await this.consumer.subscribe({ topics, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) {
              this.logger.warn(`Received empty message from ${topic}`);
              return;
            }

            const kafkaMessage: KafkaMessage = JSON.parse(
              message.value.toString()
            );

            this.logger.debug(`📥 Received message from ${topic}:`, {
              eventType: kafkaMessage.eventType,
              eventId: kafkaMessage.eventId,
              partition,
              offset: message.offset,
            });

            await handler(kafkaMessage, topic, partition, message.offset);
          } catch (error) {
            this.logger.error(`Error processing message from ${topic}:`, error);
            // Don't throw here to avoid stopping the consumer
          }
        },
      });

      this.logger.log(`📡 Subscribed to topics: ${topics.join(", ")}`);
    } catch (error) {
      this.logger.error("Failed to subscribe to topics:", error);
      throw error;
    }
  }

  /**
   * Create topics (for development/testing)
   */
  async createTopics(
    topics: Array<{
      topic: string;
      numPartitions?: number;
      replicationFactor?: number;
      configEntries?: Array<{ name: string; value: string }>;
    }>
  ): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const topicsToCreate = topics.map((t) => ({
        topic: t.topic,
        numPartitions: t.numPartitions || 3,
        replicationFactor: t.replicationFactor || 1,
        configEntries: t.configEntries || [
          { name: "compression.type", value: "gzip" },
          { name: "cleanup.policy", value: "delete" },
        ],
      }));

      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });

      await admin.disconnect();
      this.logger.log(
        `✅ Created topics: ${topics.map((t) => t.topic).join(", ")}`
      );
    } catch (error) {
      this.logger.error("Failed to create topics:", error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    clientId: string;
    connected: boolean;
    hasProducer: boolean;
    hasConsumer: boolean;
  }> {
    return {
      status: this.isConnected ? "healthy" : "unhealthy",
      clientId: this.clientId,
      connected: this.isConnected,
      hasProducer: !!this.producer,
      hasConsumer: !!this.consumer,
    };
  }

  /**
   * Get connection status
   */
  getStatus(): {
    clientId: string;
    groupId?: string;
    connected: boolean;
    brokers: string[];
  } {
    return {
      clientId: this.clientId,
      groupId: this.groupId,
      connected: this.isConnected,
      brokers: this.options.brokers,
    };
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `${this.clientId}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Get the underlying Kafka instance (for advanced usage)
   */
  getKafkaInstance(): Kafka {
    return this.kafka;
  }
}

/**
 * Topic Constants
 */
export const KAFKA_TOPICS = {
  // Core Events
  USER_EVENTS: "user.events",
  CHANNEL_EVENTS: "channel.events",
  STREAM_EVENTS: "stream.events",
  CHAT_EVENTS: "chat.events",

  // Business Events
  PAYMENT_EVENTS: "payment.events",
  ANALYTICS_EVENTS: "analytics.events",
  NOTIFICATION_EVENTS: "notification.events",
  MODERATION_EVENTS: "moderation.events",

  // System Events
  SYSTEM_EVENTS: "system.events",
  HEALTH_EVENTS: "health.events",
  AUDIT_EVENTS: "audit.events",

  // Feature-specific Topics
  VIEWER_EVENTS: "viewer.events",
  DONATION_EVENTS: "donation.events",
  SUBSCRIPTION_EVENTS: "subscription.events",
  FOLLOW_EVENTS: "follow.events",
  RECOMMENDATION_EVENTS: "recommendation.events",

  // Real-time Topics
  VIEWER_COUNT_EVENTS: "viewer-count.events",
  STREAM_QUALITY_EVENTS: "stream-quality.events",
  CHAT_MODERATION_EVENTS: "chat-moderation.events",
} as const;

/**
 * Event Type Constants
 */
export const EVENT_TYPES = {
  // User Events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_AUTHENTICATED: "user.authenticated",
  USER_LOGGED_OUT: "user.logged_out",
  USER_FOLLOWED: "user.followed",
  USER_UNFOLLOWED: "user.unfollowed",

  // Channel Events
  CHANNEL_CREATED: "channel.created",
  CHANNEL_UPDATED: "channel.updated",
  CHANNEL_DELETED: "channel.deleted",

  // Stream Events
  STREAM_STARTED: "stream.started",
  STREAM_ENDED: "stream.ended",
  STREAM_UPDATED: "stream.updated",
  STREAM_ERROR: "stream.error",
  VIEWER_JOINED: "viewer.joined",
  VIEWER_LEFT: "viewer.left",

  // Chat Events
  CHAT_MESSAGE_SENT: "chat.message_sent",
  CHAT_MESSAGE_DELETED: "chat.message_deleted",
  CHAT_USER_TIMEOUT: "chat.user_timeout",
  CHAT_USER_BANNED: "chat.user_banned",
  CHAT_SLOW_MODE_ENABLED: "chat.slow_mode_enabled",
  CHAT_SLOW_MODE_DISABLED: "chat.slow_mode_disabled",

  // Payment Events
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  DONATION_RECEIVED: "donation.received",
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",

  // System Events
  SYSTEM_STARTUP: "system.startup",
  SYSTEM_SHUTDOWN: "system.shutdown",
  SYSTEM_HEALTH_CHECK: "system.health_check",
  SYSTEM_ERROR: "system.error",
  SYSTEM_ALERT: "system.alert",
} as const;
