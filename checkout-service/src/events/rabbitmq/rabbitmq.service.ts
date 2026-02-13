import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: amqp.ChannelModel; // TCP Connection -> Producer (Actual Project) ->  To project (messaging-service)
  private channel: amqp.Channel; // Channel Hability multiply channels to one amqp.Connection -> ChannelModel -> One Channel Per Operation

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connectFunction();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connectFunction() {
    try {
      const rabbitmqUrl = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://admin:admin@localhost:5672',
      );

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.logger.log(`Connected to RabbitMQ successfully`);

      this.connection.on('error', (err) => {
        this.logger.log(`RabbitMQ connection error:`, err);
      });

      this.connection.on('ecloser', () => {
        this.logger.log(`RabbitMQ connection closed:`);
      });

      this.connection.on('blocked', (reason) => {
        this.logger.log(`RabbitMQ connection blocked:`, reason);
      });
      this.connection.on('unlocked', () => {
        this.logger.log(`RabbitMQ connection unlocked:`);
      });
    } catch (error) {
      this.logger.warn(
        `Failed to connect to RabbitMQ, continuing without message queue: `,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message || error,
      );
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        // Fechamento sempre o CANAL PRIMEIRO
        await this.channel.close();
        this.logger.log('RabbitMQ channel closed');

        if (this.connection) {
          // Depois fecha conexão
          await this.connection.close();
          this.logger.log('Disconnected from RabbitMQ');
        }
      }
    } catch (error) {
      this.logger.log(`Error disconnecting from RabbitMQ `, error);
    }
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }

  getConnection(): amqp.ChannelModel {
    return this.connection;
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: any,
  ): Promise<void> {
    try {
      if (!this.channel) {
        this.logger.warn(
          `RabbitMQ channel not available, skipping mesasge publish`,
        );
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true }); // Roteamento complexo, o 'durable' fala que se o servidor reiniciar ele vai persistir o dado.
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true, // Roteamento complexo, o 'durable' fala que se o servidor reiniciar ele vai persistir o dado.
          timestamp: Date.now(),
          contentType: 'application/json',
        },
      );

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

      this.logger.log(`Message published to ${exchange}:${routingKey}`);
      this.logger.debug(`Message content: ${JSON.stringify(message)}`);
    } catch (error) {
      this.logger.error(`Error publishing message to RabbitMQ`, error);
    }
  }

  async subscribeToQueue(
    queryName: string,
    exchange: string,
    routingKey: string,
    callback: (message: unknown) => Promise<void>,
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbiMQ channel not available');
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      const queue = await this.channel.assertQueue(queryName, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000,
          'x-max-length': 10000,
        },
      });

      await this.channel.bindQueue(queue.queue, exchange, routingKey);

      await this.channel.prefetch(1);

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      await this.channel.consume(queue.queue, async (msg) => {
        if (msg) {
          try {
            const message: unknown = JSON.parse(msg.content.toString());
            this.logger.log(`Message received from queue: ${queryName}`);
            this.logger.debug(`Message content: ${JSON.stringify(message)}`);
            await callback(message);

            this.channel.ack(msg); // processa a mensagem
            this.logger.log(
              `Message processed successfully from queue: ${queryName}`,
            );
          } catch (error) {
            this.logger.error(`Error processing message: `, error);
            this.channel.nack(msg, false, false); // rejeita a mensagem e descarta ela, talvez depois da para colocar para reprocessar novamente. //TODO: Dead Letter Queue
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error subscribing to queue ${queryName}: `, error);
    }
  }
}
