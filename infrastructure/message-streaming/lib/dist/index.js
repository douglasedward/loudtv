"use strict";
/**
 * Kafka Client Library for Livestreaming Microservices
 *
 * This library provides a standardized way to interact with Kafka across all microservices
 * in the livestreaming platform. It includes:
 *
 * - KafkaClient: Core Kafka client with producer/consumer functionality
 * - KafkaService: NestJS service wrapper for easy integration
 * - KafkaModule: NestJS module for dependency injection
 * - Constants: Topic names and event types
 * - Types: TypeScript interfaces for type safety
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_TYPES = exports.KAFKA_TOPICS = exports.KafkaModule = exports.KafkaService = exports.KafkaClient = void 0;
// Core Kafka Client
var kafka_client_1 = require("./kafka-client");
Object.defineProperty(exports, "KafkaClient", { enumerable: true, get: function () { return __importDefault(kafka_client_1).default; } });
__exportStar(require("./kafka-client"), exports);
// NestJS Integration
var kafka_service_1 = require("./kafka.service");
Object.defineProperty(exports, "KafkaService", { enumerable: true, get: function () { return kafka_service_1.KafkaService; } });
var kafka_module_1 = require("./kafka.module");
Object.defineProperty(exports, "KafkaModule", { enumerable: true, get: function () { return kafka_module_1.KafkaModule; } });
__exportStar(require("./kafka.module"), exports);
// Re-export commonly used items for convenience
var kafka_client_2 = require("./kafka-client");
Object.defineProperty(exports, "KAFKA_TOPICS", { enumerable: true, get: function () { return kafka_client_2.KAFKA_TOPICS; } });
Object.defineProperty(exports, "EVENT_TYPES", { enumerable: true, get: function () { return kafka_client_2.EVENT_TYPES; } });
/**
 * Usage Examples:
 *
 * 1. In a NestJS module:
 * ```typescript
 * @Module({
 *   imports: [KafkaModule.forMicroservice('user-service')],
 *   // ...
 * })
 * export class AppModule {}
 * ```
 *
 * 2. In a service:
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly kafkaService: KafkaService) {}
 *
 *   async createUser(userData: any) {
 *     // ... create user logic
 *     await this.kafkaService.publishUserCreated(user.id, userData);
 *   }
 * }
 * ```
 *
 * 3. Subscribe to events:
 * ```typescript
 * await this.kafkaService.subscribe(['user.events'], async (message, topic) => {
 *   console.log('Received event:', message.eventType);
 *   // Handle the event
 * });
 * ```
 */
