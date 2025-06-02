import { DynamicModule, Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';

@Global()
@Module({})
export class KafkaModule {
    static forRoot(kafkaConfig: { brokers: string[] }): DynamicModule | any {
        return {
            global: true,
            module: KafkaModule,
            providers: [{ provide: KafkaService, useValue: new KafkaService(kafkaConfig) }],
            exports: [KafkaService],
        } as DynamicModule;
    }
}