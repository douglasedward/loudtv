"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KafkaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_TYPES = exports.KAFKA_TOPICS = exports.KafkaService = void 0;
/**
 * NestJS Kafka Service for Livestreaming Microservices
 * Provides a service-oriented wrapper around the Kafka client
 */
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafka_client_1 = require("./kafka-client");
let KafkaService = KafkaService_1 = class KafkaService {
    options;
    configService;
    logger = new common_1.Logger(KafkaService_1.name);
    kafkaClient;
    serviceName;
    constructor(options, configService) {
        this.options = options;
        this.configService = configService;
        this.serviceName = options.clientId;
        this.initializeKafkaClient();
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    initializeKafkaClient() {
        let clientOptions;
        if (this.options.useConfigService && this.configService) {
            // Use ConfigService for configuration
            clientOptions = {
                clientId: this.options.clientId,
                groupId: this.options.groupId,
                brokers: this.options.brokers || [
                    this.configService.get("KAFKA_BROKER", "kafka:9092"),
                ],
                retry: {
                    initialRetryTime: this.configService.get("KAFKA_RETRY_INITIAL_TIME", 100),
                    retries: this.configService.get("KAFKA_RETRY_COUNT", 8),
                },
                connectionTimeout: this.configService.get("KAFKA_CONNECTION_TIMEOUT", 3000),
                requestTimeout: this.configService.get("KAFKA_REQUEST_TIMEOUT", 30000),
                ssl: this.configService.get("KAFKA_SSL_ENABLED", false),
                ...this.options.options,
            };
            // Add SASL configuration if enabled
            if (this.configService.get("KAFKA_SASL_ENABLED", false)) {
                clientOptions.sasl = {
                    mechanism: this.configService.get("KAFKA_SASL_MECHANISM", "plain"),
                    username: this.configService.get("KAFKA_SASL_USERNAME") || "",
                    password: this.configService.get("KAFKA_SASL_PASSWORD") || "",
                };
            }
        }
        else {
            // Use provided options
            clientOptions = {
                clientId: this.options.clientId,
                groupId: this.options.groupId,
                brokers: this.options.brokers || ["kafka:9092"],
                ...this.options.options,
            };
        }
        this.kafkaClient = new kafka_client_1.KafkaClient(clientOptions);
    }
    /**
     * Connect to Kafka
     */
    async connect() {
        try {
            await this.kafkaClient.connect();
            this.logger.log(`✅ Kafka service connected for ${this.serviceName}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to connect Kafka service for ${this.serviceName}:`, error);
            throw error;
        }
    }
    /**
     * Disconnect from Kafka
     */
    async disconnect() {
        try {
            await this.kafkaClient.disconnect();
            this.logger.log(`Kafka service disconnected for ${this.serviceName}`);
        }
        catch (error) {
            this.logger.error(`Error disconnecting Kafka service for ${this.serviceName}:`, error);
        }
    }
    /**
     * Publish an event to a topic
     */
    async publishEvent(topic, eventType, data, options) {
        const message = {
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
        const topicConfig = {
            topic,
            key: options?.key,
            headers: options?.headers,
        };
        await this.kafkaClient.publish(topicConfig, message);
    }
    /**
     * Subscribe to topics and handle messages
     */
    async subscribe(topics, handler) {
        await this.kafkaClient.subscribe(topics, async (message, topic) => {
            try {
                await handler(message, topic);
            }
            catch (error) {
                this.logger.error(`Error handling message from ${topic}:`, error);
                // Could implement dead letter queue here
            }
        });
    }
    // Convenience methods for common event types
    /**
     * Publish User Events
     */
    async publishUserEvent(eventType, userId, data, correlationId) {
        await this.publishEvent(kafka_client_1.KAFKA_TOPICS.USER_EVENTS, eventType, { userId, ...data }, { key: userId, correlationId, userId });
    }
    async publishUserCreated(userId, userData, correlationId) {
        await this.publishUserEvent(kafka_client_1.EVENT_TYPES.USER_CREATED, userId, userData, correlationId);
    }
    async publishUserUpdated(userId, userData, correlationId) {
        await this.publishUserEvent(kafka_client_1.EVENT_TYPES.USER_UPDATED, userId, userData, correlationId);
    }
    async publishUserDeleted(userId, correlationId) {
        await this.publishUserEvent(kafka_client_1.EVENT_TYPES.USER_DELETED, userId, {}, correlationId);
    }
    /**
     * Publish Channel Events
     */
    async publishChannelEvent(eventType, channelId, data, correlationId) {
        await this.publishEvent(kafka_client_1.KAFKA_TOPICS.CHANNEL_EVENTS, eventType, { channelId, ...data }, { key: channelId, correlationId });
    }
    async publishChannelCreated(channelId, channelData, correlationId) {
        await this.publishChannelEvent(kafka_client_1.EVENT_TYPES.CHANNEL_CREATED, channelId, channelData, correlationId);
    }
    async publishChannelUpdated(channelId, channelData, correlationId) {
        await this.publishChannelEvent(kafka_client_1.EVENT_TYPES.CHANNEL_UPDATED, channelId, channelData, correlationId);
    }
    async publishChannelDeleted(channelId, correlationId) {
        await this.publishChannelEvent(kafka_client_1.EVENT_TYPES.CHANNEL_DELETED, channelId, {}, correlationId);
    }
    /**
     * Publish Stream Events
     */
    async publishStreamEvent(eventType, streamId, data, correlationId) {
        await this.publishEvent(kafka_client_1.KAFKA_TOPICS.STREAM_EVENTS, eventType, { streamId, ...data }, { key: streamId, correlationId });
    }
    async publishStreamStarted(streamId, streamData, correlationId) {
        await this.publishStreamEvent(kafka_client_1.EVENT_TYPES.STREAM_STARTED, streamId, streamData, correlationId);
    }
    async publishStreamEnded(streamId, streamData, correlationId) {
        await this.publishStreamEvent(kafka_client_1.EVENT_TYPES.STREAM_ENDED, streamId, streamData, correlationId);
    }
    async publishViewerJoined(streamId, viewerData, correlationId) {
        await this.publishStreamEvent(kafka_client_1.EVENT_TYPES.VIEWER_JOINED, streamId, viewerData, correlationId);
    }
    async publishViewerLeft(streamId, viewerData, correlationId) {
        await this.publishStreamEvent(kafka_client_1.EVENT_TYPES.VIEWER_LEFT, streamId, viewerData, correlationId);
    }
    /**
     * Publish Chat Events
     */
    async publishChatEvent(eventType, channelId, data, correlationId) {
        await this.publishEvent(kafka_client_1.KAFKA_TOPICS.CHAT_EVENTS, eventType, { channelId, ...data }, { key: channelId, correlationId });
    }
    async publishChatMessage(channelId, messageData, correlationId) {
        await this.publishChatEvent(kafka_client_1.EVENT_TYPES.CHAT_MESSAGE_SENT, channelId, messageData, correlationId);
    }
    async publishChatModeration(channelId, moderationData, correlationId) {
        await this.publishChatEvent(kafka_client_1.EVENT_TYPES.CHAT_USER_TIMEOUT, channelId, moderationData, correlationId);
    }
    /**
     * Publish Payment Events
     */
    async publishPaymentEvent(eventType, paymentId, data, correlationId) {
        await this.publishEvent(kafka_client_1.KAFKA_TOPICS.PAYMENT_EVENTS, eventType, { paymentId, ...data }, { key: paymentId, correlationId });
    }
    async publishPaymentCompleted(paymentId, paymentData, correlationId) {
        await this.publishPaymentEvent(kafka_client_1.EVENT_TYPES.PAYMENT_COMPLETED, paymentId, paymentData, correlationId);
    }
    async publishDonationReceived(donationId, donationData, correlationId) {
        await this.publishPaymentEvent(kafka_client_1.EVENT_TYPES.DONATION_RECEIVED, donationId, donationData, correlationId);
    }
    /**
     * Publish Analytics Events
     */
    async publishAnalyticsEvent(eventType, data, correlationId) {
        await this.publishEvent(kafka_client_1.KAFKA_TOPICS.ANALYTICS_EVENTS, eventType, data, {
            correlationId,
        });
    }
    /**
     * Publish System Events
     */
    async publishSystemEvent(eventType, data, correlationId) {
        await this.publishEvent(kafka_client_1.KAFKA_TOPICS.SYSTEM_EVENTS, eventType, { service: this.serviceName, ...data }, { key: this.serviceName, correlationId });
    }
    async publishSystemStartup(metadata = {}) {
        await this.publishSystemEvent(kafka_client_1.EVENT_TYPES.SYSTEM_STARTUP, {
            timestamp: new Date().toISOString(),
            ...metadata,
        });
    }
    async publishSystemShutdown(metadata = {}) {
        await this.publishSystemEvent(kafka_client_1.EVENT_TYPES.SYSTEM_SHUTDOWN, {
            timestamp: new Date().toISOString(),
            ...metadata,
        });
    }
    async publishHealthCheck(status, details = {}) {
        await this.publishSystemEvent(kafka_client_1.EVENT_TYPES.SYSTEM_HEALTH_CHECK, {
            status,
            timestamp: new Date().toISOString(),
            ...details,
        });
    }
    /**
     * Health check
     */
    async healthCheck() {
        return this.kafkaClient.healthCheck();
    }
    /**
     * Get status
     */
    getStatus() {
        return this.kafkaClient.getStatus();
    }
    /**
     * Get the underlying Kafka client (for advanced usage)
     */
    getKafkaClient() {
        return this.kafkaClient;
    }
    /**
     * Create topics (for development/testing)
     */
    async createTopics(topics) {
        await this.kafkaClient.createTopics(topics);
    }
    /**
     * Generate a unique event ID
     */
    generateEventId() {
        return `${this.serviceName}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = KafkaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)("KAFKA_OPTIONS")),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], KafkaService);
var kafka_client_2 = require("./kafka-client");
Object.defineProperty(exports, "KAFKA_TOPICS", { enumerable: true, get: function () { return kafka_client_2.KAFKA_TOPICS; } });
Object.defineProperty(exports, "EVENT_TYPES", { enumerable: true, get: function () { return kafka_client_2.EVENT_TYPES; } });
