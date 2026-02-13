import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [RabbitmqService],
  exports: [RabbitmqService],
  imports: [ConfigModule],
})
export class EventsModule {}
