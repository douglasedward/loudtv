/**
 * Shared Kafka Client Library for Livestreaming Microservices
 * Provides a standardized way to interact with Kafka across all services
 */
import { Kafka } from "kafkajs";
export interface KafkaEventBase {
    eventId: string;
    eventType: string;
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
export declare class KafkaClient {
    private readonly options;
    private readonly logger;
    private readonly kafka;
    private producer?;
    private consumer?;
    private isConnected;
    private readonly clientId;
    private readonly groupId?;
    constructor(options: KafkaClientOptions);
    /**
     * Initialize the Kafka client (connect producer and consumer)
     */
    connect(producerOptions?: ProducerOptions, consumerOptions?: ConsumerOptions): Promise<void>;
    /**
     * Disconnect from Kafka
     */
    disconnect(): Promise<void>;
    /**
     * Publish a message to a topic
     */
    publish<T = any>(topicConfig: TopicConfig, message: KafkaMessage<T>): Promise<void>;
    /**
     * Subscribe to topics and consume messages
     */
    subscribe(topics: string[], handler: (message: KafkaMessage, topic: string, partition: number, offset: string) => Promise<void>): Promise<void>;
    /**
     * Create topics (for development/testing)
     */
    createTopics(topics: Array<{
        topic: string;
        numPartitions?: number;
        replicationFactor?: number;
        configEntries?: Array<{
            name: string;
            value: string;
        }>;
    }>): Promise<void>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: "healthy" | "unhealthy";
        clientId: string;
        connected: boolean;
        hasProducer: boolean;
        hasConsumer: boolean;
    }>;
    /**
     * Get connection status
     */
    getStatus(): {
        clientId: string;
        groupId?: string;
        connected: boolean;
        brokers: string[];
    };
    /**
     * Generate a unique event ID
     */
    private generateEventId;
    /**
     * Get the underlying Kafka instance (for advanced usage)
     */
    getKafkaInstance(): Kafka;
}
/**
 * Topic Constants
 */
export declare const KAFKA_TOPICS: {
    readonly USER_EVENTS: "user.events";
    readonly CHANNEL_EVENTS: "channel.events";
    readonly STREAM_EVENTS: "stream.events";
    readonly CHAT_EVENTS: "chat.events";
    readonly PAYMENT_EVENTS: "payment.events";
    readonly ANALYTICS_EVENTS: "analytics.events";
    readonly NOTIFICATION_EVENTS: "notification.events";
    readonly MODERATION_EVENTS: "moderation.events";
    readonly SYSTEM_EVENTS: "system.events";
    readonly HEALTH_EVENTS: "health.events";
    readonly AUDIT_EVENTS: "audit.events";
    readonly VIEWER_EVENTS: "viewer.events";
    readonly DONATION_EVENTS: "donation.events";
    readonly SUBSCRIPTION_EVENTS: "subscription.events";
    readonly FOLLOW_EVENTS: "follow.events";
    readonly RECOMMENDATION_EVENTS: "recommendation.events";
    readonly VIEWER_COUNT_EVENTS: "viewer-count.events";
    readonly STREAM_QUALITY_EVENTS: "stream-quality.events";
    readonly CHAT_MODERATION_EVENTS: "chat-moderation.events";
};
/**
 * Event Type Constants
 */
export declare const EVENT_TYPES: {
    readonly USER_CREATED: "user.created";
    readonly USER_UPDATED: "user.updated";
    readonly USER_DELETED: "user.deleted";
    readonly USER_AUTHENTICATED: "user.authenticated";
    readonly USER_LOGGED_OUT: "user.logged_out";
    readonly USER_FOLLOWED: "user.followed";
    readonly USER_UNFOLLOWED: "user.unfollowed";
    readonly CHANNEL_CREATED: "channel.created";
    readonly CHANNEL_UPDATED: "channel.updated";
    readonly CHANNEL_DELETED: "channel.deleted";
    readonly STREAM_STARTED: "stream.started";
    readonly STREAM_ENDED: "stream.ended";
    readonly STREAM_UPDATED: "stream.updated";
    readonly STREAM_ERROR: "stream.error";
    readonly VIEWER_JOINED: "viewer.joined";
    readonly VIEWER_LEFT: "viewer.left";
    readonly CHAT_MESSAGE_SENT: "chat.message_sent";
    readonly CHAT_MESSAGE_DELETED: "chat.message_deleted";
    readonly CHAT_USER_TIMEOUT: "chat.user_timeout";
    readonly CHAT_USER_BANNED: "chat.user_banned";
    readonly CHAT_SLOW_MODE_ENABLED: "chat.slow_mode_enabled";
    readonly CHAT_SLOW_MODE_DISABLED: "chat.slow_mode_disabled";
    readonly PAYMENT_COMPLETED: "payment.completed";
    readonly PAYMENT_FAILED: "payment.failed";
    readonly DONATION_RECEIVED: "donation.received";
    readonly SUBSCRIPTION_CREATED: "subscription.created";
    readonly SUBSCRIPTION_CANCELLED: "subscription.cancelled";
    readonly SYSTEM_STARTUP: "system.startup";
    readonly SYSTEM_SHUTDOWN: "system.shutdown";
    readonly SYSTEM_HEALTH_CHECK: "system.health_check";
    readonly SYSTEM_ERROR: "system.error";
    readonly SYSTEM_ALERT: "system.alert";
};
export default KafkaClient;
