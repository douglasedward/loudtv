import { Controller, Get, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrometheusController } from "@willsoto/nestjs-prometheus";

@ApiTags("metrics")
@Controller()
export class MetricsController extends PrometheusController {
  @Get("metrics")
  @ApiOperation({ summary: "Prometheus metrics endpoint" })
  @ApiResponse({
    status: 200,
    description: "Prometheus metrics in text format",
    schema: {
      type: "string",
      example:
        '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",status="200"} 100',
    },
  })
  async index(@Res() response: any) {
    return super.index(response);
  }
}
