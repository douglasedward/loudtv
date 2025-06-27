/**
 * NestJS Kafka Service for LoudTV
 */
import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KafkaClient, KafkaMessage } from "./kafka-client";
import { KafkaModuleOptions } from "./kafka.module";
export declare class KafkaService implements OnModuleInit, OnModuleDestroy {
    private readonly options;
    private readonly configService?;
    private readonly logger;
    private kafkaClient;
    private readonly serviceName;
    constructor(options: KafkaModuleOptions, configService?: ConfigService | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private initializeKafkaClient;
    /**
     * Connect to Kafka
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Kafka
     */
    disconnect(): Promise<void>;
    /**
     * Publish an event to a topic
     */
    publishEvent<T = any>(topic: string, eventType: string, data: T, options?: {
        key?: string;
        correlationId?: string;
        userId?: string;
        sessionId?: string;
        headers?: Record<string, string>;
    }): Promise<void>;
    /**
     * Subscribe to topics and handle messages
     */
    subscribe(topics: string[], handler: (message: KafkaMessage, topic: string) => Promise<void>): Promise<void>;
    /**
     * Publish User Events
     */
    publishUserEvent<T = any>(eventType: string, userId: string, data: T, correlationId?: string): Promise<void>;
    publishUserCreated(userId: string, userData: any, correlationId?: string): Promise<void>;
    publishUserUpdated(userId: string, userData: any, correlationId?: string): Promise<void>;
    publishUserDeleted(userId: string, correlationId?: string): Promise<void>;
    /**
     * Publish Channel Events
     */
    publishChannelEvent<T = any>(eventType: string, channelId: string, data: T, correlationId?: string): Promise<void>;
    publishChannelCreated(channelId: string, channelData: any, correlationId?: string): Promise<void>;
    publishChannelUpdated(channelId: string, channelData: any, correlationId?: string): Promise<void>;
    publishChannelDeleted(channelId: string, correlationId?: string): Promise<void>;
    /**
     * Publish Stream Events
     */
    publishStreamEvent<T = any>(eventType: string, streamId: string, username: string, data: T, correlationId?: string): Promise<void>;
    publishStreamStarted(streamId: string, username: string, streamData: any, correlationId?: string): Promise<void>;
    publishStreamEnded(streamId: string, username: string, streamData: any, correlationId?: string): Promise<void>;
    publishViewerJoined(streamId: string, username: string, viewerData: any, correlationId?: string): Promise<void>;
    publishViewerLeft(streamId: string, username: string, viewerData: any, correlationId?: string): Promise<void>;
    /**
     * Publish Chat Events
     */
    publishChatEvent<T = any>(eventType: string, channelId: string, data: T, correlationId?: string): Promise<void>;
    publishChatMessage(channelId: string, messageData: any, correlationId?: string): Promise<void>;
    publishChatModeration(channelId: string, moderationData: any, correlationId?: string): Promise<void>;
    /**
     * Publish Analytics Events
     */
    publishAnalyticsEvent<T = any>(eventType: string, data: T, correlationId?: string): Promise<void>;
    /**
     * Health check
     */
    healthCheck(): Promise<any>;
    /**
     * Get status
     */
    getStatus(): any;
    /**
     * Get the underlying Kafka client (for advanced usage)
     */
    getKafkaClient(): KafkaClient;
    /**
     * Create topics (for development/testing)
     */
    createTopics(topics: Array<{
        topic: string;
        numPartitions?: number;
        replicationFactor?: number;
    }>): Promise<void>;
    /**
     * Generate a unique event ID
     */
    private generateEventId;
}
