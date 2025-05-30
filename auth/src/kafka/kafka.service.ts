import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;

    constructor(private kafkaConfig: { brokers: string[] }) {
        this.kafka = new Kafka({ brokers: this.kafkaConfig.brokers });
        this.producer = this.kafka.producer();
    }

    async onModuleInit(): Promise<void> {
        await this.connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.disconnect();
    }

    async connect() {
        await this.producer.connect();
    }

    async disconnect() {
        await this.producer.disconnect();
    }

    async sendMessage(message: string, level: string = 'info') {
        return await this.producer
            .send({ topic: 'logs', messages: [{ value: JSON.stringify({ service: 'auth', level: level || 'info', message }) }] })
            .catch(e => console.error(e.message, e));
    }
}