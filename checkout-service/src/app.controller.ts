import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { PaymentOrderMessage } from './events/payment-queue.interface';
import { PaymentQueueService } from './events/payment-queue/payment-queue.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly paymentQueueService: PaymentQueueService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test/send-message')
  async testSendMessage(@Body() body?: Partial<PaymentOrderMessage>) {
    const testMessage: PaymentOrderMessage = {
      orderId: body?.orderId || `test-order-${Date.now()}`,
      userId: body?.userId || 'test-user-123',
      amount: body?.amount || 199.99,
      items: body?.items || [
        {
          price: 99.99,
          productId: 'product-1',
          quantity: 2,
        },
      ],
      paymentMethod: body?.paymentMethod || 'credit_card',
      createdAt: new Date(),
      description: body?.description || 'Mensagem de teste',
    };

    await this.paymentQueueService.publishPaymentOrder(testMessage);

    return {
      success: true,
      message: 'Mensagem enviada para o RabbitMQ',
      data: testMessage,
    };
  }
}
