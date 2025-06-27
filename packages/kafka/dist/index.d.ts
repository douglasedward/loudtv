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
export { default as KafkaClient } from "./kafka-client";
export * from "./kafka-client";
export { KafkaService } from "./kafka.service";
export { KafkaModule } from "./kafka.module";
export * from "./kafka.module";
export { KAFKA_TOPICS, EVENT_TYPES } from "./kafka-client";
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
