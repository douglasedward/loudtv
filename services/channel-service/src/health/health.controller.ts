import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Get overall health status" })
  @ApiResponse({
    status: 200,
    description: "Health status retrieved successfully",
  })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get("ready")
  @ApiOperation({ summary: "Get readiness status" })
  @ApiResponse({
    status: 200,
    description: "Readiness status retrieved successfully",
  })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get("live")
  @ApiOperation({ summary: "Get liveness status" })
  @ApiResponse({
    status: 200,
    description: "Liveness status retrieved successfully",
  })
  async getLiveness() {
    return this.healthService.getLiveness();
  }
}
