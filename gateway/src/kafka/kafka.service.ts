import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Partitioners, Producer } from 'kafkajs';


@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;

    constructor(private kafkaConfig: { brokers: string[] }) {
        try {
            console.log('CONNECT TO KAFKA: ' + JSON.stringify(this.kafkaConfig.brokers))
            this.kafka = new Kafka({ brokers: this.kafkaConfig.brokers });
            this.producer = this.kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner, allowAutoTopicCreation: true });
        }
        catch (e) {
            console.log('KafkaService.constructor');
            console.log(e);
        }
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.producer.connect();
            await this.sendMessage('Connecting to Kafka');
        }
        catch (e) {
            console.log('KafkaService.onModuleInit');
            console.log(e);
        }
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.producer.disconnect();
        }
        catch (e) {
            console.log('KafkaService.onModuleDestroy');
            console.log(e);
        }
    }

    async sendMessage(message: string, level: string = 'info') {
        try {
            await this.producer.send({ topic: 'logs', messages: [{ value: JSON.stringify({ service: 'auth', level: level || 'info', message }) }] });
        }
        catch (e) {
            console.error('Error KafkaService.sendMessage');
        }
    }
}