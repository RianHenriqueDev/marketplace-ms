import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
  imports: [HttpModule],
})
export class CircuitBreakerModule {}
