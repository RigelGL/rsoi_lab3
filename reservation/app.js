const express = require("express");


function createApp(dba, sendLog) {
    const app = express();
    app.use(express.json());

    app.get('/hotels', async (req, res) => {
        try {
            const page = Math.max(1, +req.query.page || 0) - 1;
            const limit = Math.min(1000, Math.max(1, +req.query.limit || 0));
            const search = req.query.search?.trim() || '';
            res.json(await dba.findHotels(page, limit, search));
            sendLog(`/hotels ${JSON.stringify({ page, limit, search })}`);
        } catch (e) {
            res.status(500).end();
            sendLog(`$/hotels {e}`, 'error')
        }
    });
    app.get('/hotel/:uid', async (req, res) => {
        try {
            const hotel = (await dba.findHotelsByUids([req.params.uid]))[0];
            sendLog(`/hotel/${req.params.uid} (${hotel ? 'ok' : 'not found'}`, 'info');
            if (!hotel) return res.status(404).end();
            res.json(hotel).end();
        } catch (e) {
            res.status(500).end();
            sendLog(`/hotel/:uid ${e}`, 'error');
        }
    });

    app.post('/hotel', async (req, res) => {
        const body = req.body;
        try {
            const hotel = {
                hotelUid: body.hotelUid,
                name: body.name,
                country: body.country,
                city: body.city,
                address: body.address,
                stars: body.stars,
                price: body.price
            };

            res.json({ uid: hotel.hotelUid ? await dba.addHotelWithUid(hotel) : await dba.addHotel(hotel) }).end();
            sendLog(`POST /hotel ${JSON.stringify({ hotel })}`);
        } catch (e) {
            res.status(500).end();
            sendLog(`/hotel ${e}`, 'error');
        }
    });

    app.get('/reservations', async (req, res) => {
        const reservations = await dba.findReservations(JSON.parse(req.query.s || '{}'));

        const hotels = new Map();
        reservations.forEach(e => hotels.set(e.hotelUid, null));

        (await dba.findHotelsByUids(Array.from(hotels.keys()))).forEach(e => hotels.set(e.hotelUid, e));
        reservations.forEach(e => e.hotel = hotels.get(e.hotelUid));

        res.json(reservations);
        sendLog(`/reservation ${req.query.s}`);
    });
    app.post('/reservation', async (req, res) => {
        const body = req.body;
        const userUid = body.userUid;
        const hotelUid = body.hotelUid;
        const paymentUid = body.paymentUid;
        const startDate = body.startDate;
        const endDate = body.endDate;

        sendLog(`POST /reservation ${JSON.stringify({ userUid, hotelUid, paymentUid, startDate, endDate })}`);
        const hotel = await dba.findHotelsByUids(hotelUid);
        if (!hotel) {
            sendLog(`POST /reservation hotel ${hotelUid} not found`, 'warning');
            return res.status(404).end();
        }

        const uid = await dba.addReservation(userUid, paymentUid, hotel.id, startDate, endDate);
        const ret = (await dba.findReservations({ uid }))[0];
        if (!ret) {
            sendLog(`POST /reservation cant create reservation`, 'error');
            return res.status(500);
        }
        res.json(ret).end();
    });
    app.delete('/reservation/:uid', async (req, res) => {
        const uid = req.params.uid;
        if (!uid) return res.status(400).end();
        const success = await dba.cancelReservation(uid);
        res.status(success ? 200 : 404).end();
        if (success)
            sendLog(`POST /reservation ${uid})} deleted`);
    });

    app.get('/manage/health', async (req, res) => res.send('OK').end());

    sendLog('init api')
    return app;
}

module.exports = { createApp };