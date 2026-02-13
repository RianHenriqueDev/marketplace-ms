import { Module } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { HttpModule } from '@nestjs/axios';
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';

@Module({
  providers: [HealthCheckService],
  exports: [HealthCheckService],
  imports: [HttpModule, CircuitBreakerModule],
})
export class HealthCheckModule {}
