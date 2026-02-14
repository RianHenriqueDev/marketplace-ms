import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { PaymentQueueService } from './payment-queue/payment-queue.service';
import { PaymentConsumerService } from './payment-consumer/payment-consumer.service';

@Module({
  providers: [RabbitmqService, PaymentQueueService, PaymentConsumerService],
})
export class EventsModule {}
