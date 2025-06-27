# LoudTV Kafka Client Library

A standardized Kafka client library for LoudTV.

## Quick Start

### 1. Import the Module

```typescript
import { Module } from "@nestjs/common";
import { KafkaModule } from "@loudtv/kafka";

@Module({
  imports: [
    // Simple setup
    KafkaModule.forMicroservice("user-service"),

    // Or custom config
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
import { KafkaService, EVENT_TYPES, KAFKA_TOPICS } from "@loudtv/kafka";

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
KAFKA_BROKERS=kafka:9092
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

## Advanced Usage

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

### Creating Topics

```typescript
// Create topics for development/testing
await kafkaService.createTopics([
  { topic: "test.events", numPartitions: 3 },
  { topic: "dev.events", numPartitions: 1 },
]);
```
