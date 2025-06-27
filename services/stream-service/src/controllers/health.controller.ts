import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from "@nestjs/terminus";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MediaService } from "../services/media.service";
import { RedisService } from "../services/redis.service";
import { UserService } from "../services/user.service";
import { FfmpegService } from "../services/ffmpeg.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mediaService: MediaService,
    private redisService: RedisService,
    private userService: UserService,
    private ffmpegService: FfmpegService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @ApiResponse({ status: 503, description: "Service is unhealthy" })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        const isHealthy = await this.mediaService.isHealthy();
        return {
          rtmp: {
            status: isHealthy ? "up" : "down",
          },
        };
      },
      async (): Promise<HealthIndicatorResult> => {
        const isHealthy = await this.redisService.isHealthy();
        return {
          redis: {
            status: isHealthy ? "up" : "down",
          },
        };
      },

      async (): Promise<HealthIndicatorResult> => {
        const isHealthy = await this.userService.isHealthy();
        return {
          userService: {
            status: isHealthy ? "up" : "down",
          },
        };
      },
      async (): Promise<HealthIndicatorResult> => {
        const isHealthy = await this.ffmpegService.isHealthy();
        return {
          ffmpeg: {
            status: isHealthy ? "up" : "down",
          },
        };
      },
    ]);
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness check endpoint" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  async readiness(): Promise<{ status: string }> {
    const checks = await Promise.allSettled([
      this.mediaService.isHealthy(),
      this.redisService.isHealthy(),
    ]);

    const allHealthy = checks.every(
      (check) => check.status === "fulfilled" && check.value === true,
    );

    if (allHealthy) {
      return { status: "ready" };
    } else {
      throw new Error("Service not ready");
    }
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness check endpoint" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  liveness(): { status: string } {
    return { status: "alive" };
  }
}
