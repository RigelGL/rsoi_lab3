import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = process.env.GATEWAY_PORT ?? 3000;
    console.log(`Gateway runs on ${port}`);
    await app.listen(port);
}

bootstrap();
