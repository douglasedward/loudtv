import { Controller, Get, Header } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  @ApiOperation({ summary: "Get Prometheus metrics" })
  @ApiResponse({
    status: 200,
    description: "Metrics retrieved successfully",
    content: {
      "text/plain": {
        schema: {
          type: "string",
        },
      },
    },
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
