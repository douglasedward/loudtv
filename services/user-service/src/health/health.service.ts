import { Injectable } from "@nestjs/common";
import { TypeOrmHealthIndicator, HealthCheckService } from "@nestjs/terminus";

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  checkHealth() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }

  checkReadiness() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }
}
