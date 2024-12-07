const { raw } = require("express");

class HotelDba {

    /** @type {Pool} */
    pool = null;

    constructor(pool) {
        this.pool = pool;
        pool.query('SELECT VERSION() version').then(e => console.log(e.rows[0].version));
    }

    async close() {
        await this.pool.end();
    }

    async initTables() {
        const fs = await import('node:fs')
        const data = fs.readFileSync('res/init.sql', 'utf8');
        if (data) {
            await this.pool.query(data);
            console.log('DB UPDATED');
        }
    }

    __getHotelFullAddress(e) {
        return [e.country, e.city, e.address].join(', ')
    }

    __mapHotel(e) {
        return {
            id: e.id,
            hotelUid: e.hotel_uid,
            name: e.name,
            country: e.country,
            city: e.city,
            address: e.address,
            stars: e.stars,
            price: e.price,
            fullAddress: this.__getHotelFullAddress(e),
        };
    }

    async findHotels(page, limit) {
        const count = +(await this.pool.query('SELECT COUNT(*) cnt FROM hotels')).rows[0].cnt;

        return {
            totalElements: count,
            items: (await this.pool.query(
                `SELECT id,
                        hotel_uid,
                        name,
                        country,
                        city,
                        address,
                        stars,
                        price
                 FROM hotels
                 LIMIT $1 OFFSET $2`,
                [limit, limit * page])).rows.map(e => this.__mapHotel(e))
        };
    }

    async addHotel(hotel) {
        return (await this.pool.query(
            `INSERT INTO hotels (hotel_uid, name, country, city, address, stars, price)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
             RETURNING hotel_uid AS uid`,
            [hotel.name, hotel.country, hotel.city, hotel.address, hotel.stars, hotel.price])).rows[0].uid;
    }

    async addHotelWithUid(hotel) {
        return (await this.pool.query(
            `INSERT INTO hotels (hotel_uid, name, country, city, address, stars, price)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING hotel_uid AS uid`,
            [hotel.hotelUid, hotel.name, hotel.country, hotel.city, hotel.address, hotel.stars, hotel.price])).rows[0].uid;
    }

    async findReservations(options) {
        const arr = [];
        const where = [];
        if (options?.userName) {
            arr.push(options.userName);
            where.push(`r.username = $${arr.length}`);
        }
        if (options?.uid) {
            arr.push(options.uid);
            where.push(`r.reservation_uid = $${arr.length}`);
        }

        return (await this.pool.query(
            `SELECT r.id,
                    reservation_uid,
                    username,
                    payment_uid,
                    h.hotel_uid,
                    status,
                    start_date,
                    end_date
             FROM reservation r
                      INNER JOIN hotels h ON h.id = r.hotel_id
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`, arr)).rows.map(e => ({
            id: e.id,
            userName: e.username,
            reservationUid: e.reservation_uid,
            payment: { paymentUid: e.payment_uid, },
            hotelUid: e.hotel_uid,
            status: e.status,
            startDate: e.start_date.toISOString().substring(0, 10),
            endDate: e.end_date.toISOString().substring(0, 10),
        }));
    }

    async findHotelsByUids(uids) {
        const asOne = !Array.isArray(uids);
        if (asOne) uids = [uids];
        const e = (await this.pool.query(
            `SELECT id,
                    hotel_uid,
                    name,
                    country,
                    city,
                    address,
                    stars,
                    price
             FROM hotels
             WHERE hotel_uid::text = ANY ($1)`, [uids])).rows.map(e => this.__mapHotel(e));
        return asOne ? e[0] : e;
    }

    async addReservation(userName, paymentUid, hotelId, startDate, endDate) {
        return (await this.pool.query(
            `INSERT INTO reservation (reservation_uid, username, payment_uid, hotel_id, status, start_date, end_date)
             VALUES (gen_random_uuid(), $1, $2, $3, 'PAID', $4, $5)
             RETURNING reservation_uid AS uid`,
            [userName, paymentUid, hotelId, startDate + 'Z', endDate + 'Z'])).rows[0].uid;
    }

    async cancelReservation(uid) {
        return (await this.pool.query('UPDATE reservation SET status = $1 WHERE reservation_uid = $2', ['CANCELED', uid])).rowCount > 0;
    }
}


module.exports = { HotelDba };