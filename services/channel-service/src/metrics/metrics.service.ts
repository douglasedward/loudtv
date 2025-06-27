import { Injectable, Logger } from "@nestjs/common";
import {
  register,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // Counters
  public readonly httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  public readonly channelsTotal = new Counter({
    name: "channels_total",
    help: "Total number of channels created",
    labelNames: ["category"],
  });

  public readonly streamsTotal = new Counter({
    name: "streams_total",
    help: "Total number of streams started",
    labelNames: ["channel_id", "category"],
  });

  public readonly moderationActionsTotal = new Counter({
    name: "moderation_actions_total",
    help: "Total number of moderation actions taken",
    labelNames: ["action", "channel_id", "automatic"],
  });

  public readonly searchQueriesTotal = new Counter({
    name: "search_queries_total",
    help: "Total number of search queries performed",
    labelNames: ["type", "has_results"],
  });

  // Histograms
  public readonly httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.1, 0.5, 1, 2.5, 5, 10],
  });

  public readonly databaseQueryDuration = new Histogram({
    name: "database_query_duration_seconds",
    help: "Duration of database queries in seconds",
    labelNames: ["operation", "collection"],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  });

  public readonly cacheOperationDuration = new Histogram({
    name: "cache_operation_duration_seconds",
    help: "Duration of cache operations in seconds",
    labelNames: ["operation", "hit"],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  });

  // Gauges
  public readonly activeStreams = new Gauge({
    name: "active_streams_current",
    help: "Current number of active streams",
    labelNames: ["category"],
  });

  public readonly activeChannels = new Gauge({
    name: "active_channels_current",
    help: "Current number of active channels",
    labelNames: ["category"],
  });

  public readonly cacheHitRate = new Gauge({
    name: "cache_hit_rate",
    help: "Cache hit rate percentage",
    labelNames: ["cache_type"],
  });

  public readonly databaseConnections = new Gauge({
    name: "database_connections_current",
    help: "Current number of database connections",
  });

  constructor() {
    // Register default metrics (CPU, memory, etc.)
    collectDefaultMetrics({
      register,
      prefix: "channel_service_",
    });

    this.logger.log("Metrics service initialized");
  }

  // Increment counters
  incrementHttpRequests(
    method: string,
    route: string,
    statusCode: number
  ): void {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
  }

  incrementChannels(category?: string): void {
    this.channelsTotal.inc({ category: category || "unknown" });
  }

  incrementStreams(channelId: string, category?: string): void {
    this.streamsTotal.inc({
      channel_id: channelId,
      category: category || "unknown",
    });
  }

  incrementModerationActions(
    action: string,
    channelId: string,
    automatic: boolean
  ): void {
    this.moderationActionsTotal.inc({
      action,
      channel_id: channelId,
      automatic: automatic.toString(),
    });
  }

  incrementSearchQueries(type: string, hasResults: boolean): void {
    this.searchQueriesTotal.inc({
      type,
      has_results: hasResults.toString(),
    });
  }

  // Record histograms
  recordHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    this.httpRequestDuration
      .labels({
        method,
        route,
        status_code: statusCode.toString(),
      })
      .observe(duration);
  }

  recordDatabaseQueryDuration(
    operation: string,
    collection: string,
    duration: number
  ): void {
    this.databaseQueryDuration
      .labels({
        operation,
        collection,
      })
      .observe(duration);
  }

  recordCacheOperationDuration(
    operation: string,
    hit: boolean,
    duration: number
  ): void {
    this.cacheOperationDuration
      .labels({
        operation,
        hit: hit.toString(),
      })
      .observe(duration);
  }

  // Set gauges
  setActiveStreams(category: string, count: number): void {
    this.activeStreams.set({ category }, count);
  }

  setActiveChannels(category: string, count: number): void {
    this.activeChannels.set({ category }, count);
  }

  setCacheHitRate(cacheType: string, rate: number): void {
    this.cacheHitRate.set({ cache_type: cacheType }, rate);
  }

  setDatabaseConnections(count: number): void {
    this.databaseConnections.set(count);
  }

  // Get metrics for Prometheus scraping
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Reset all metrics (useful for testing)
  reset(): void {
    register.clear();
    this.logger.log("All metrics cleared");
  }

  // Create a timer for measuring durations
  createTimer(name: string): () => number {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.logger.debug(`Timer ${name}: ${duration}s`);
      return duration;
    };
  }
}
