import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { DatabasePerformanceService } from "./database-performance.service";

@Module({
  imports: [TypeOrmModule, ConfigModule],
  providers: [DatabasePerformanceService],
  exports: [DatabasePerformanceService],
})
export class PerformanceModule {}
