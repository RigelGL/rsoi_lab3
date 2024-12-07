const postgresql = require('pg');
require('dotenv').config();

const { HotelDba } = require("./Dba");
const { createApp } = require("./app");

const pool = new postgresql.Pool({
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: 5432
});
const dba = new HotelDba(pool);
dba.initTables();

const port = process.env.APP_PORT;
const app = createApp(dba);
app.listen(port, () => console.log(`Reservation runs on ${port}`));