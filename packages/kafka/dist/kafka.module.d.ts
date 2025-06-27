/**
 * NestJS Kafka Module for LoudTV
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
