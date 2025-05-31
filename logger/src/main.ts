import { config } from "dotenv";

import { Pool } from 'pg';

config({ path: `.env` });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from "@nestjs/platform-express";


(async function () {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: false });
    const port = process.env.APP_PORT || 8080;
    console.log(`Auth runs on PORT ${port}, database: ${process.env.DB_URL}`);


    const conn = new Pool({
        connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}`,
        maxUses: 1,
    });

    const res = await conn.query(
        `SELECT table_name AS name
         FROM information_schema.tables
         WHERE table_schema = 'public'`);

    if (res.rows.length === 0) {
        await conn.query(
            `create table logs
             (
                 id        bigserial
                     constraint logs_pk primary key,
                 timestamp timestamp   not null,
                 service   varchar(64) not null,
                 level     varchar(32) not null,
                 message   text        not null
             )`);
    }
    conn.end();

    await app.listen(port, '0.0.0.0');
})();
