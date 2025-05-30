import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { KafkaModule } from "./kafka/kafka.module";


@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}`,
            autoLoadEntities: false,
            synchronize: false,
            poolSize: 10,
            logging: 'all',
        }),
        KafkaModule.forRoot({ brokers: [process.env.KAFKA || ''] })
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
