import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka = new Kafka({ brokers: [process.env.KAFKA || ''] });
    private consumer: Consumer;

    async onModuleInit() {
        this.consumer = this.kafka.consumer({ groupId: 'log-group' });
        await this.consumer.subscribe({ topic: 'logs', fromBeginning: false });
        await this.consumer.connect();
    }

    async consume(callback: (timestamp: string, message: any) => Promise<void>) {
        await this.consumer.run({
            eachMessage: async ({ message }) => {
                const value = message.value?.toString();
                if (value)
                    await callback(message.timestamp, JSON.parse(value));
            },
        });
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }
}