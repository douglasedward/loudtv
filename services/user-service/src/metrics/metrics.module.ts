import { Module } from "@nestjs/common";
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from "@willsoto/nestjs-prometheus";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: "user_service_",
        },
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    makeCounterProvider({
      name: "user_service_http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "endpoint", "status_code"],
    }),
    makeHistogramProvider({
      name: "user_service_http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "endpoint"],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    }),
    makeCounterProvider({
      name: "user_service_user_operations_total",
      help: "Total number of user operations",
      labelNames: ["operation", "status"],
    }),
    makeGaugeProvider({
      name: "user_service_active_users",
      help: "Number of active users",
    }),
    makeCounterProvider({
      name: "user_service_follows_total",
      help: "Total number of follow operations",
      labelNames: ["operation"],
    }),
    makeCounterProvider({
      name: "user_service_auth_operations_total",
      help: "Total number of authentication operations",
      labelNames: ["operation", "status"],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
