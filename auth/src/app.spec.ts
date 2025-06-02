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

    it('/test', async () => {
        return request(app.getHttpServer()).get('/test')
            .expect(200)
            .then(response => {
                expect(response.headers['content-type'].startsWith('text/html')).toBeTruthy();
            });
    });

    it('/supported', async () => {
        return request(app.getHttpServer()).get('/supported')
            .expect(200).then(response => {
                expect(response.body).toContain('self');
            });
    });

    it('/well-known', async () => {
        return request(app.getHttpServer()).get('/well-known')
            .expect(200)
            .then(response => {
                expect(response.body.length).toBeGreaterThanOrEqual(1);
                expect(response.body[0]).toHaveProperty('kid', 'default');
                expect(response.body[0]).toHaveProperty('alg', 'RSA');
                expect(response.body[0].exp.length).toBeGreaterThanOrEqual(4);
                expect(response.body[0].mod.length).toBeGreaterThanOrEqual(20);
            });
    });


});
