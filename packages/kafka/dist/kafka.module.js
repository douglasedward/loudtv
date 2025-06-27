"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KafkaModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaModule = void 0;
/**
 * NestJS Kafka Module for Livestreaming Microservices
 * Provides a NestJS-compatible module for Kafka integration
 */
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafka_service_1 = require("./kafka.service");
let KafkaModule = KafkaModule_1 = class KafkaModule {
    static forRoot(options) {
        const providers = [
            {
                provide: "KAFKA_OPTIONS",
                useValue: options,
            },
            kafka_service_1.KafkaService,
        ];
        return {
            module: KafkaModule_1,
            imports: options.useConfigService ? [config_1.ConfigModule] : [],
            providers,
            exports: [kafka_service_1.KafkaService],
        };
    }
    static forRootAsync(options) {
        const providers = [
            {
                provide: "KAFKA_OPTIONS",
                useFactory: options.useFactory,
                inject: options.inject || [],
            },
            kafka_service_1.KafkaService,
        ];
        return {
            module: KafkaModule_1,
            imports: options.imports || [],
            providers,
            exports: [kafka_service_1.KafkaService],
        };
    }
    /**
     * Standard configuration for microservices
     */
    static forMicroservice(serviceName) {
        return this.forRootAsync({
            imports: [config_1.ConfigModule],
            useFactory: (configService) => ({
                clientId: serviceName,
                groupId: `${serviceName}-group`,
                useConfigService: true,
                options: {
                    brokers: [configService.get("KAFKA_BROKERS", "kafka:9092")],
                    retry: {
                        initialRetryTime: 100,
                        retries: 8,
                    },
                    connectionTimeout: 3000,
                    requestTimeout: 30000,
                },
            }),
            inject: [config_1.ConfigService],
        });
    }
};
exports.KafkaModule = KafkaModule;
exports.KafkaModule = KafkaModule = KafkaModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], KafkaModule);
