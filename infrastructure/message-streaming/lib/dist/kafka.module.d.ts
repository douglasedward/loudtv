/**
 * NestJS Kafka Module for Livestreaming Microservices
 * Provides a NestJS-compatible module for Kafka integration
 */
import { DynamicModule } from "@nestjs/common";
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
    useFactory?: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
    inject?: any[];
}
export declare class KafkaModule {
    static forRoot(options: KafkaModuleOptions): DynamicModule;
    static forRootAsync(options: KafkaModuleAsyncOptions): DynamicModule;
    /**
     * Standard configuration for microservices
     */
    static forMicroservice(serviceName: string): DynamicModule;
}
