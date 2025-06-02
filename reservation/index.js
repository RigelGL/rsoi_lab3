const postgresql = require('pg');
require('dotenv').config();

const { HotelDba } = require("./Dba");
const { createApp } = require("./app");

const { Kafka } = require('kafkajs');

const kafka = new Kafka({ brokers: [process.env.KAFKA] });
const producer = kafka.producer();

async function sendLog(message, level = 'info') {
    await producer.send({ topic: 'logs', messages: [{ value: JSON.stringify({ service: 'reservation', level: level || 'info', message }) }] });
}

process.on('exit', async () => await producer.disconnect());

(async function () {
    console.log(`using: ${process.env.DB_HOST}/${process.env.DB_NAME} as ${process.env.DB_USER}`)
    const pool = new postgresql.Pool({
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: 5432
    });
    const dba = new HotelDba(pool);
    await dba.initTables();
    await producer.connect();

    const port = process.env.APP_PORT;
    const app = createApp(dba, sendLog);
    app.listen(port, () => console.log(`Reservation runs on ${port}`));
})();

