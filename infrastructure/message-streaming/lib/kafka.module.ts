/**
 * NestJS Kafka Module for Livestreaming Microservices
 * Provides a NestJS-compatible module for Kafka integration
 */
import { Module, DynamicModule, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { KafkaService } from "./kafka.service";
import { KafkaClientOptions } from "./kafka-client";

export interface KafkaModuleOptions {
  name?: string;
  clientId: string;
  groupId?: string;
  brokers?: string[];
  useConfigService?: boolean;
  options?: Partial<KafkaClientOptions>;
}

export interface KafkaModuleAsyncOptions {
  name?: string;
  imports?: any[];
  useFactory?: (
    ...args: any[]
  ) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
  inject?: any[];
}

@Global()
@Module({})
export class KafkaModule {
  static forRoot(options: KafkaModuleOptions): DynamicModule {
    const providers = [
      {
        provide: "KAFKA_OPTIONS",
        useValue: options,
      },
      KafkaService,
    ];

    return {
      module: KafkaModule,
      imports: options.useConfigService ? [ConfigModule] : [],
      providers,
      exports: [KafkaService],
    };
  }

  static forRootAsync(options: KafkaModuleAsyncOptions): DynamicModule {
    const providers = [
      {
        provide: "KAFKA_OPTIONS",
        useFactory: options.useFactory!,
        inject: options.inject || [],
      },
      KafkaService,
    ];

    return {
      module: KafkaModule,
      imports: options.imports || [],
      providers,
      exports: [KafkaService],
    };
  }

  /**
   * Standard configuration for microservices
   */
  static forMicroservice(serviceName: string): DynamicModule {
    return this.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): KafkaModuleOptions => ({
        clientId: serviceName,
        groupId: `${serviceName}-group`,
        useConfigService: true,
        options: {
          brokers: [configService.get("KAFKA_BROKER", "kafka:9092")],
          retry: {
            initialRetryTime: 100,
            retries: 8,
          },
          connectionTimeout: 3000,
          requestTimeout: 30000,
        },
      }),
      inject: [ConfigService],
    });
  }
}
