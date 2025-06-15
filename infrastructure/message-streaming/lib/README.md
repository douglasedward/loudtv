# LoudTV Kafka Client Library

A standardized Kafka client library for all microservices in the LoudTV livestreaming platform.

## Features

- 🚀 **Easy Integration**: Simple NestJS module for quick setup
- 🔧 **Type Safety**: Full TypeScript support with interfaces and enums
- 📦 **Event Standards**: Predefined event types and topic constants
- 🔄 **Auto-Retry**: Built-in retry logic for resilient messaging
- 🏥 **Health Checks**: Built-in health monitoring
- 📊 **Metrics Ready**: Structured for easy metrics integration
- 🔌 **Flexible Config**: Environment-based and direct configuration options

## Installation

### From GitHub Repository (Recommended)

Install directly from the GitHub repository:

```bash
npm install github:douglaseduardo/loudtv-microservices#main --save
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "@loudtv/kafka-client": "github:douglaseduardo/loudtv-microservices#main",
    "kafkajs": "^2.2.4"
  }
}
```

### Alternative: Specific Subdirectory (if needed)

If you need to specify the subdirectory path:

```bash
npm install git+https://github.com/douglaseduardo/loudtv-microservices.git#main
```

## Quick Start

### 1. Import the Module

```typescript
import { Module } from "@nestjs/common";
import { KafkaModule } from "@loudtv/kafka-client";

@Module({
  imports: [
    // Simple setup for a microservice
    KafkaModule.forMicroservice("user-service"),

    // Or custom configuration
    KafkaModule.forRoot({
      clientId: "user-service",
      groupId: "user-service-group",
      brokers: ["kafka:9092"],
      useConfigService: true,
    }),
  ],
})
export class AppModule {}
```

### 2. Use in Services

```typescript
import { Injectable } from "@nestjs/common";
import { KafkaService, EVENT_TYPES, KAFKA_TOPICS } from "@loudtv/kafka-client";

@Injectable()
export class UserService {
  constructor(private readonly kafkaService: KafkaService) {}

  async createUser(userData: any) {
    // Create user logic...
    const user = await this.userRepository.save(userData);

    // Publish event
    await this.kafkaService.publishUserCreated(user.id, userData);

    return user;
  }

  async onModuleInit() {
    // Subscribe to events
    await this.kafkaService.subscribe(
      [KAFKA_TOPICS.PAYMENT_EVENTS, KAFKA_TOPICS.STREAM_EVENTS],
      async (message, topic) => {
        switch (message.eventType) {
          case EVENT_TYPES.PAYMENT_COMPLETED:
            await this.handlePaymentCompleted(message.data);
            break;
          case EVENT_TYPES.STREAM_STARTED:
            await this.handleStreamStarted(message.data);
            break;
        }
      }
    );
  }
}
```

## Configuration

### Environment Variables

```bash
# Kafka Configuration
KAFKA_BROKER=kafka:9092
KAFKA_RETRY_INITIAL_TIME=100
KAFKA_RETRY_COUNT=8
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000

# Security (optional)
KAFKA_SSL_ENABLED=false
KAFKA_SASL_ENABLED=false
KAFKA_SASL_MECHANISM=plain
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=
```

### Custom Configuration

```typescript
KafkaModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    clientId: "my-service",
    groupId: "my-service-group",
    brokers: configService.get("KAFKA_BROKERS", "kafka:9092").split(","),
    options: {
      ssl: configService.get("KAFKA_SSL_ENABLED", false),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    },
  }),
  inject: [ConfigService],
});
```

## Available Methods

### Publishing Events

```typescript
// Generic event publishing
await kafkaService.publishEvent("user.events", "user.created", userData);

// Convenience methods for common events
await kafkaService.publishUserCreated(userId, userData);
await kafkaService.publishUserUpdated(userId, changes);
await kafkaService.publishUserDeleted(userId);

await kafkaService.publishChannelCreated(channelId, channelData);
await kafkaService.publishStreamStarted(streamId, streamData);
await kafkaService.publishChatMessage(channelId, messageData);

await kafkaService.publishPaymentCompleted(paymentId, paymentData);
await kafkaService.publishDonationReceived(donationId, donationData);

await kafkaService.publishSystemStartup();
await kafkaService.publishHealthCheck("healthy", { uptime: process.uptime() });
```

### Consuming Events

```typescript
// Subscribe to multiple topics
await kafkaService.subscribe(
  ["user.events", "stream.events"],
  async (message, topic) => {
    console.log(`Received ${message.eventType} from ${topic}`);
    // Process the event
  }
);
```

## Event Types and Topics

### Available Topics

```typescript
import { KAFKA_TOPICS } from "@loudtv/kafka-client";

// Core Events
KAFKA_TOPICS.USER_EVENTS; // 'user.events'
KAFKA_TOPICS.CHANNEL_EVENTS; // 'channel.events'
KAFKA_TOPICS.STREAM_EVENTS; // 'stream.events'
KAFKA_TOPICS.CHAT_EVENTS; // 'chat.events'

// Business Events
KAFKA_TOPICS.PAYMENT_EVENTS; // 'payment.events'
KAFKA_TOPICS.ANALYTICS_EVENTS; // 'analytics.events'
KAFKA_TOPICS.NOTIFICATION_EVENTS; // 'notification.events'

// System Events
KAFKA_TOPICS.SYSTEM_EVENTS; // 'system.events'
KAFKA_TOPICS.HEALTH_EVENTS; // 'health.events'
```

### Available Event Types

```typescript
import { EVENT_TYPES } from "@loudtv/kafka-client";

// User Events
EVENT_TYPES.USER_CREATED; // 'user.created'
EVENT_TYPES.USER_UPDATED; // 'user.updated'
EVENT_TYPES.USER_DELETED; // 'user.deleted'

// Stream Events
EVENT_TYPES.STREAM_STARTED; // 'stream.started'
EVENT_TYPES.STREAM_ENDED; // 'stream.ended'
EVENT_TYPES.VIEWER_JOINED; // 'viewer.joined'

// Chat Events
EVENT_TYPES.CHAT_MESSAGE_SENT; // 'chat.message_sent'
EVENT_TYPES.CHAT_USER_TIMEOUT; // 'chat.user_timeout'

// Payment Events
EVENT_TYPES.PAYMENT_COMPLETED; // 'payment.completed'
EVENT_TYPES.DONATION_RECEIVED; // 'donation.received'
```

## Message Structure

All messages follow a standard structure:

```typescript
interface KafkaMessage<T = any> {
  eventId: string; // Unique event identifier
  eventType: string; // Type of event (e.g., 'user.created')
  source: string; // Service that published the event
  timestamp: string; // ISO 8601 timestamp
  version: string; // Schema version
  correlationId?: string; // For tracing requests
  userId?: string; // User context
  sessionId?: string; // Session context
  data: T; // Event payload
  metadata?: Record<string, any>; // Additional metadata
}
```

## Health Checks

```typescript
// Get service health
const health = await kafkaService.healthCheck();
console.log(health.status); // 'healthy' | 'unhealthy'

// Get connection status
const status = kafkaService.getStatus();
console.log(status.connected); // boolean
```

## Advanced Usage

### Direct Kafka Client Access

```typescript
const kafkaClient = kafkaService.getKafkaClient();
const kafka = kafkaClient.getKafkaInstance();

// Use kafkajs directly for advanced features
const admin = kafka.admin();
await admin.connect();
// ...
```

### Custom Event Publishing

```typescript
await kafkaService.publishEvent(
  "custom.topic",
  "custom.event.type",
  { custom: "data" },
  {
    key: "custom-key",
    correlationId: "trace-123",
    headers: { "custom-header": "value" },
  }
);
```

## Error Handling

The library includes built-in error handling with retry logic. Errors are logged but don't stop the consumer by default.

```typescript
// Consumer errors are logged but don't crash the service
await kafkaService.subscribe(["topic"], async (message, topic) => {
  try {
    await processMessage(message);
  } catch (error) {
    // This error is caught and logged by the library
    // The consumer continues processing other messages
    throw error;
  }
});
```

## Best Practices

1. **Use Correlation IDs**: Always pass correlation IDs for request tracing
2. **Event Versioning**: Use semantic versioning for event schemas
3. **Idempotent Consumers**: Design consumers to handle duplicate messages
4. **Error Handling**: Implement proper error handling and dead letter queues
5. **Monitoring**: Monitor consumer lag and error rates
6. **Schema Evolution**: Plan for backward-compatible schema changes

## Development and Testing

### Creating Topics

```typescript
// Create topics for development/testing
await kafkaService.createTopics([
  { topic: "test.events", numPartitions: 3 },
  { topic: "dev.events", numPartitions: 1 },
]);
```

### Testing

The library is designed to work well with testing frameworks. Mock the KafkaService for unit tests:

```typescript
const mockKafkaService = {
  publishUserCreated: jest.fn(),
  subscribe: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue({ status: "healthy" }),
};
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit a pull request

## License

MIT
