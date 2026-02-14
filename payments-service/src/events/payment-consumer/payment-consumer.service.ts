import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PaymentQueueService } from '../payment-queue/payment-queue.service';
import { PaymentOrderMessage } from '../payment-queue.interface';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class PaymentConsumerService implements OnModuleInit {
  private readonly logger = new Logger(PaymentConsumerService.name);

  constructor(
    private readonly paymentQueueService: PaymentQueueService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Payment Consumer Service');
    await this.startConsuming();
  }

  async startConsuming() {
    try {
      this.logger.log('Starting to consume payment orders from queue');

      const isConnected = await this.rabbitmqService.waitForConnection();

      if (!isConnected) {
        this.logger.error(
          'Could not connect to RabbitMQ after multiple attempts',
        );
        return;
      }
      // Registra callback para processar cada mensagem
      //O bind(this) garante que o 'this' dentro do callback seja esta classe
      await this.paymentQueueService.consumePaymentOrders(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.processPaymentOrder.bind(this),
      );
      this.logger.log('Payment Consumer Service started successfully');
    } catch (error) {
      this.logger.log('Failed to start consuming payment orders: ', error);
    }
  }

  private processPaymentOrder(message: PaymentOrderMessage): void {
    try {
      //Log inicial com as informações da mensagem
      this.logger.log(
        `Processing payment order: ` +
          `orderId=${message.orderId}, ` +
          `userId=${message.userId}, ` +
          `amount=${message.amount}`,
      );
      //Validar mensagem antes de processar
      if (!this.validateMessage(message)) {
        this.logger.log('Invalid payment message received');
        return;
      }

      this.logger.log('Payment order received and validated');
    } catch (error) {
      this.logger.error(
        `Failed to process payment for order ${message.orderId} `,
        error,
      );

      // IMPORTANTE: Reenvie o erro para o RabbitMQ fazer o nack() -> Remover da FILA/Excluir
      throw error;
    }
  }

  private validateMessage(paymentOrder: PaymentOrderMessage): boolean {
    if (!paymentOrder.orderId) {
      this.logger.error(`Missing orderId in payment message`);
      return false;
    }

    if (!paymentOrder.userId) {
      this.logger.error(`Missing userId in payment message`);
      return false;
    }

    if (!paymentOrder.amount || paymentOrder.amount <= 0) {
      this.logger.error(`Invalid amount in payment message`);
      return false;
    }

    if (!paymentOrder.paymentMethod) {
      this.logger.error(`Missing paymentMethod in payment message`);
      return false;
    }

    if (!paymentOrder.items || paymentOrder.items.length == 0) {
      this.logger.error(`No items in payment message`);
      return false;
    }

    return true;
  }
}
