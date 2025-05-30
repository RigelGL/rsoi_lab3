import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { KafkaService } from "./kafka.service";
import { LogEntity } from "./entity";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}`,
            autoLoadEntities: false,
            synchronize: false,
            poolSize: 10,
            logging: 'all',
            entities: [LogEntity],
        }),
        TypeOrmModule.forFeature([LogEntity]),
    ],
    controllers: [AppController],
    providers: [KafkaService, AppService],
})
export class AppModule {
}
