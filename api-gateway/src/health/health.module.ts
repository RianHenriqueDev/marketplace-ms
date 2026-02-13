import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { HealthCheckService } from 'src/common/health/health-check.service';
import { HealthCheckModule } from 'src/common/health/health-check.module';

@Module({
  providers: [HealthService],
  imports: [HealthCheckModule],
  controllers: [HealthController],
})
export class HealthModule {}
