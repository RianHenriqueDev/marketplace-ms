import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { ConfigModule } from '@nestjs/config';
import { PaymentQueueService } from './payment-queue/payment-queue.service';

@Module({
  providers: [RabbitmqService, PaymentQueueService],
  exports: [RabbitmqService, PaymentQueueService],
  imports: [ConfigModule],
})
export class EventsModule {}
