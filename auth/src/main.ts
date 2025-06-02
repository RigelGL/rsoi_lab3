import { config } from "dotenv";
config({ path: ['.env', '.env.secrets'] });

import { Pool } from 'pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from "@nestjs/platform-express";


(async function () {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: false });
    const port = process.env.APP_PORT || 8080;
    console.log(`Auth runs on PORT ${port}, database: ${process.env.DB_URL}`);

    console.log(`USE DB ${process.env.DB_URL}`)

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
            `create table account
             (
                 sub       varchar(24)                                    not null
                     primary key,
                 name      varchar(150)                                   not null,
                 email     varchar(60)                                    not null
                     constraint user_email_uk
                         unique,
                 password  varchar(255) default NULL::character varying,
                 role      varchar(16)  default 'user'::character varying not null,
                 yandex_id varchar(64)  default NULL::character varying
                     constraint account_yandex_pk
                         unique,
                 google_id varchar(64)  default NULL::character varying
                     constraint account_google_pk
                         unique
             )`);

        await conn.query(
            `create table refresh
             (
                 token      varchar(128)                        not null
                     primary key,
                 created_at timestamp default CURRENT_TIMESTAMP not null,
                 sub        varchar(24)                         not null
                     constraint refresh_account_sub_fk
                         references account
             )`);
    }

    const account = (await conn.query('SELECT sub, name FROM account WHERE sub = $1', ['admin-sub']))?.rows?.[0];

    if (!account) {
        await conn.query(
            `INSERT INTO account (sub, name, email, password, role)
             VALUES ($1, $2, $3, $4, $5)`, ['admin-sub', 'Admin', 'admin', 'plain:123456', 'admin']);
        console.log('Admin created');
    }
    else
        console.log('Admin found');

    await conn.end();

    await app.listen(port, '0.0.0.0');
})();
