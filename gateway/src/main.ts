import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from "@nestjs/platform-express";


declare global {
    namespace Express {
        interface Request {
            sub: string;
            role: 'admin' | 'user';
            jwt: string;
        }
    }
}

(async function () {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: false });

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        next();
    });

    app.enableCors({
        origin: ['http://localhost:8090', 'http://localhost:8080', 'https://demo.rigellab.ru'],
        methods: 'GET,HEAD,PUT,POST,DELETE,OPTIONS',
    });

    const port = process.env.GATEWAY_PORT ?? 3000;
    console.log(`Gateway runs on ${port}`);
    await app.listen(port, '0.0.0.0');
})();
