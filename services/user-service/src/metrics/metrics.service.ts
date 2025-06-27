import { Injectable } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Histogram, Gauge } from "prom-client";

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric("user_service_http_requests_total")
    private readonly httpRequestsTotal: Counter<string>,

    @InjectMetric("user_service_http_request_duration_seconds")
    private readonly httpRequestDuration: Histogram<string>,

    @InjectMetric("user_service_user_operations_total")
    private readonly userOperationsTotal: Counter<string>,

    @InjectMetric("user_service_active_users")
    private readonly activeUsersGauge: Gauge<string>,

    @InjectMetric("user_service_follows_total")
    private readonly followsTotal: Counter<string>,

    @InjectMetric("user_service_auth_operations_total")
    private readonly authOperationsTotal: Counter<string>,
  ) {}

  // HTTP Metrics
  incrementHttpRequests(method: string, endpoint: string, statusCode: string) {
    this.httpRequestsTotal.inc({ method, endpoint, status_code: statusCode });
  }

  observeHttpRequestDuration(
    method: string,
    endpoint: string,
    duration: number,
  ) {
    this.httpRequestDuration.observe({ method, endpoint }, duration);
  }

  // User Operation Metrics
  incrementUserOperation(operation: string, status: "success" | "failure") {
    this.userOperationsTotal.inc({ operation, status });
  }

  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  // Follow Metrics
  incrementFollowOperation(operation: "follow" | "unfollow") {
    this.followsTotal.inc({ operation });
  }

  // Authentication Metrics
  incrementAuthOperation(operation: string, status: "success" | "failure") {
    this.authOperationsTotal.inc({ operation, status });
  }

  // Combined method for request tracking
  trackRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
  ) {
    this.incrementHttpRequests(method, endpoint, statusCode.toString());
    this.observeHttpRequestDuration(method, endpoint, duration);
  }
}
