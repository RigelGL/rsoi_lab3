const express = require("express");


function createApp(dba) {
    const app = express();
    app.use(express.json());

    app.get('/hotels', async (req, res) => {
        try {
            const page = Math.max(1, +req.query.page || 0) - 1;
            const limit = Math.min(1000, Math.max(1, +req.query.limit || 0));
            res.json(await dba.findHotels(page, limit));
        } catch (e) {
            res.send(e);
        }
    });
    app.get('/hotel/:uid', async (req, res) => {
        const hotel = (await dba.findHotelsByUids([req.params.uid]))[0];
        if (!hotel) return res.status(404).end();
        res.json(hotel).end();
    });

    app.post('/hotel', async (req, res) => {
        const body = req.body;
        try {
            res.json({
                uid: await dba.addHotelWithUid({
                    hotelUid: body.hotelUid,
                    name: body.name,
                    country: body.country,
                    city: body.city,
                    address: body.address,
                    stars: body.stars,
                    price: body.price
                })
            }).end();
        } catch (e) {
            res.status(500).end();
        }
    });

    app.get('/reservations', async (req, res) => {
        const reservations = await dba.findReservations(JSON.parse(req.query.s || '{}'));

        const hotels = new Map();
        reservations.forEach(e => hotels.set(e.hotelUid, null));

        (await dba.findHotelsByUids(Array.from(hotels.keys()))).forEach(e => hotels.set(e.hotelUid, e));
        reservations.forEach(e => e.hotel = hotels.get(e.hotelUid));

        res.json(reservations);
    });
    app.post('/reservation', async (req, res) => {
        const body = req.body;
        const userName = body.userName;
        const hotelUid = body.hotelUid;
        const paymentUid = body.paymentUid;
        const startDate = body.startDate;
        const endDate = body.endDate;

        const hotel = await dba.findHotelsByUids(hotelUid);
        if (!hotel) return res.status(404).end();

        const uid = await dba.addReservation(userName, paymentUid, hotel.id, startDate, endDate);
        const ret = (await dba.findReservations({ uid }))[0];
        if (!ret) return res.status(500);
        res.json(ret).end();
    });
    app.delete('/reservation/:uid', async (req, res) => {
        const uid = req.params.uid;
        if (!uid) return res.status(400).end();
        const success = await dba.cancelReservation(uid);
        res.status(success ? 200 : 404).end();
    });

    app.get('/manage/health', async (req, res) => res.send('OK').end());
    return app;
}

module.exports = { createApp };