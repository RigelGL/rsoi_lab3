import pg from 'pg';
import { expect } from 'chai';
import supertest from 'supertest';
import { HotelDba } from '../Dba.js';
import { createApp } from '../app.js';


describe('App tests', () => {
    const database = `test_reservation_${Math.random().toString(36).substring(2)}`;
    let app;
    let dba;

    before(async () => {
        const client = new pg.Client({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: 5432 });
        try {
            await client.connect();
            await client.query(`CREATE DATABASE ${database}`);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            console.log(`DB ${database} created`);
            await client.end();
        }

        const pool = new pg.Pool({ user: process.env.DB_USER, database, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: 5432 });

        dba = new HotelDba(pool);
        await dba.initTables();

        app = createApp(dba);
    });

    after(async () => {
        const client = new pg.Client({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: 5432 });
        try {
            await dba.close();
            await client.connect();
            await client.query(`DROP DATABASE ${database}`);
        }
        catch (e) {
            console.log(e)
        }
        finally {
            console.log(`DB ${database} cleared`);
            await client.end();
        }
    });


    it('health check', async () => {
        const res = await supertest(app).get('/manage/health');
        expect(res.text).to.eq('OK')
    });

    it('hotels is empty', async () => {
        const res = await supertest(app).get('/hotels');
        expect(res.body.totalElements).to.eq(0);
        expect(res.body.items.length).to.eq(0);
    });

    let hotelUid;
    it('found added add hotel', async () => {
        const hotel = { name: 'Test', country: 'Russia', city: 'Moscow', address: 'Kremlin', stars: 5, price: 1000 };
        await dba.addHotel(hotel);
        hotel.fullAddress = `${hotel.country}, ${hotel.city}, ${hotel.address}`;

        const res = await supertest(app).get('/hotels');
        expect(res.body.totalElements).to.eq(1);
        const retHotel = res.body.items[0];
        for (let key of Object.keys(hotel))
            expect(hotel[key]).to.eq(retHotel[key]);
        expect(retHotel.hotelUid).to.exist;
        hotelUid = retHotel.hotelUid;
    });

    it('empty reservations', async () => {
        const res = await supertest(app).get('/reservations');
        expect(res.body.length).to.eq(0);
    });

    let reservationUid;
    it('reserve hotel', async () => {
        const reservation = { userName: 'username', paymentUid: '42e0018b-54ac-4d96-888a-bdebf1f664c3', hotelUid, startDate: '2024-10-12', endDate: '2024-10-15' };
        const res = await supertest(app)
            .post('/reservation')
            .set('Content-Type', 'application/json')
            .send(reservation);
        expect(res.body.id).to.exist;
        expect(res.body.reservationUid).to.exist;

        expect(res.body.payment.paymentUid).to.eq(reservation.paymentUid);
        delete reservation.paymentUid;
        for (let key of Object.keys(reservation))
            expect(res.body[key]).to.eq(reservation[key]);
        expect(res.body.hotelUid).to.eq(hotelUid);
        expect(res.body.status).to.eq('PAID');
        reservationUid = res.body.reservationUid;
    });

    it('cancel invalid reservation', async () => {
        const res = await supertest(app).delete(`/reservation/b0e9c577-79ca-4b33-a054-2559367ecb91`);
        expect(res.status).to.eq(404);
    });

    it('cancel reservation', async () => {
        const res = await supertest(app).delete(`/reservation/${reservationUid}`);
        expect(res.status).to.eq(200);
    });
});
