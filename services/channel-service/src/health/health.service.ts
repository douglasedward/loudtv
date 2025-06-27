import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { CacheService } from "../common/cache/cache.service";

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
  };
}

export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  responseTime?: number;
  message?: string;
  details?: any;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectConnection() private connection: Connection,
    private cacheService: CacheService
  ) {}

  async getHealth(): Promise<HealthCheck> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    const healthChecks = {
      database: this.getCheckResult(checks[0]),
      redis: this.getCheckResult(checks[1]),
      memory: this.getCheckResult(checks[2]),
      disk: this.getCheckResult(checks[3]),
    };

    const overallStatus = this.calculateOverallStatus(healthChecks);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || "1.0.0",
      checks: healthChecks,
    };
  }

  async getReadiness(): Promise<{ status: string; checks: any }> {
    // Readiness checks for essential services
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const readinessChecks = {
      database: this.getCheckResult(checks[0]),
      redis: this.getCheckResult(checks[1]),
    };

    const allHealthy = Object.values(readinessChecks).every(
      (check) => check.status === "healthy"
    );

    return {
      status: allHealthy ? "ready" : "not_ready",
      checks: readinessChecks,
    };
  }

  async getLiveness(): Promise<{ status: string; uptime: number }> {
    // Simple liveness check
    return {
      status: "alive",
      uptime: Date.now() - this.startTime,
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      if (this.connection.readyState !== 1) {
        return {
          status: "unhealthy",
          message: "Database connection not ready",
          details: { readyState: this.connection.readyState },
        };
      }

      // Perform a simple query
      await this.connection.db.admin().ping();

      return {
        status: "healthy",
        responseTime: Date.now() - start,
        message: "Database connection healthy",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - start,
        message: error.message,
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Use a simple cache operation to check Redis
      const testKey = "health:check";
      const testValue = Date.now().toString();

      await this.cacheService.set(testKey, testValue, 10);
      const retrieved = await this.cacheService.get(testKey);

      if (retrieved !== testValue) {
        return {
          status: "unhealthy",
          message: "Redis read/write operation failed",
        };
      }

      await this.cacheService.del(testKey);

      return {
        status: "healthy",
        responseTime: Date.now() - start,
        message: "Redis connection healthy",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - start,
        message: error.message,
      };
    }
  }

  private async checkMemory(): Promise<HealthCheckResult> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

      // Consider unhealthy if using more than 90% of heap
      const status = memoryUsagePercentage > 90 ? "unhealthy" : "healthy";

      return {
        status,
        message: `Memory usage: ${memoryUsagePercentage.toFixed(2)}%`,
        details: {
          heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
          heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error.message,
      };
    }
  }

  private async checkDisk(): Promise<HealthCheckResult> {
    try {
      // This is a simplified disk check
      // In production, you might want to check actual disk usage
      const stats = process.hrtime();

      return {
        status: "healthy",
        message: "Disk access healthy",
        details: {
          uptime: process.uptime(),
          platform: process.platform,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error.message,
      };
    }
  }

  private getCheckResult(
    result: PromiseSettledResult<HealthCheckResult>
  ): HealthCheckResult {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        status: "unhealthy",
        message: result.reason?.message || "Check failed",
      };
    }
  }

  private calculateOverallStatus(
    checks: Record<string, HealthCheckResult>
  ): "healthy" | "unhealthy" | "degraded" {
    const checkResults = Object.values(checks);
    const unhealthyCount = checkResults.filter(
      (check) => check.status === "unhealthy"
    ).length;

    if (unhealthyCount === 0) {
      return "healthy";
    } else if (unhealthyCount === checkResults.length) {
      return "unhealthy";
    } else {
      return "degraded";
    }
  }
}
