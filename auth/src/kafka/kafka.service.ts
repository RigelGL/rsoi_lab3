import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;

    constructor(private kafkaConfig: { brokers: string[] }) {
        try {
            console.log('CONNECT TO KAFKA: ' + this.kafkaConfig.brokers.join(', '))
            this.kafka = new Kafka({ brokers: this.kafkaConfig.brokers });
            this.producer = this.kafka.producer();
        }
        catch (e) {
        }
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.connect();
        }
        catch (e) {
        }
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.disconnect();
        }
        catch (e) {
        }
    }

    async connect() {
        try {
            await this.producer.connect();
        }
        catch (e) {
        }
    }

    async disconnect() {
        try {
            await this.producer.disconnect();
        }
        catch (e) {
        }
    }

    async sendMessage(message: string, level: string = 'info') {
        try {
            await this.producer
                .send({ topic: 'logs', messages: [{ value: JSON.stringify({ service: 'auth', level: level || 'info', message }) }] })
                .catch(e => console.error(e.message, e));
        }
        catch (e) {
        }
    }
}