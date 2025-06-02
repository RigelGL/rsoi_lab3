import { config } from "dotenv";
config({ path: ['.env', '.env.secrets'] });

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './app.module';
import { NestExpressApplication } from "@nestjs/platform-express";
import { NestFactory } from "@nestjs/core";


describe('AppController (e2e)', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
        app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: false });
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/manage/health', () => {
        return request(app.getHttpServer()).get('/manage/health')
            .expect(200)
            .expect('OK');
    });
});
