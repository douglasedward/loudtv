import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthCheckResult } from "@nestjs/terminus";

import { HealthService } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
  })
  @ApiResponse({
    status: 503,
    description: "Service is unhealthy",
  })
  check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness check endpoint" })
  @ApiResponse({
    status: 200,
    description: "Service is ready",
  })
  @ApiResponse({
    status: 503,
    description: "Service is not ready",
  })
  readiness(): Promise<HealthCheckResult> {
    return this.healthService.checkReadiness();
  }
}
