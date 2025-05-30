import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ApiService } from './api/api.service';
import { ConfigModule } from '@nestjs/config';
import { LoyaltyThirdService } from "./third/loyalty.third.service";
import { ReservationThirdService } from "./third/reservation.third.service";
import { ApiController } from "./api/api.controller";
import { PaymentThirdService } from "./third/payment.third.service";
import { PersonThirdService } from "./third/person.third.service";
import { AppService } from "./app.service";
import { TestController } from "./test.controller";
import { AuthThirdService } from "./third/auth.third.service";
import { AuthMiddleware } from "./middleware";
import { LoggerThirdService } from "./third/loggerThirdService";


@Module({
    imports: [ConfigModule.forRoot({ envFilePath: '.env' })],
    controllers: [AppController, ApiController, TestController],
    providers: [
        ApiService,
        AppService,
        LoyaltyThirdService,
        PaymentThirdService,
        PersonThirdService,
        ReservationThirdService,
        LoggerThirdService,
        AuthThirdService,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): any {
        consumer.apply(AuthMiddleware).forRoutes('*')
    }
}
