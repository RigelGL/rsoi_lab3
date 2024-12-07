import { Injectable } from '@nestjs/common';
import { HotelInfo, Pagination, ReservationInfo } from "../api/dto";
import { Healthy } from "./Healthy";
import * as wasi from "node:wasi";

@Injectable()
export class ReservationThirdService extends Healthy {

    constructor() {
        super(process.env.RESERVATION_URL, {
            maxFails: 5,
            failTimeoutMs: 60_000,
            afterFailWaitMs: 10_000,
            retryIntervalMs: 3_000,
        });
    }

    async getHotels(page: number, size: number): Promise<Pagination<HotelInfo>> {
        try {
            page ||= 1;
            size ||= 20;

            const wrapper = await this.runWithProtect(
                async () => fetch(`${this.url}/hotels?page=${page}&size=${size}`));
            if (wrapper.failed || wrapper.result?.status !== 200) return null;

            const json = await wrapper.result.json();

            return {
                items: json.items,
                totalElements: json.totalElements,
                pageSize: size,
                page
            }
        } catch (e) {
            return null;
        }
    }

    async getHotel(uid: string): Promise<HotelInfo> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/hotel/${uid}`));
        if (wrapper.failed || wrapper.result?.status !== 200) return null;
        return await wrapper.result.json();
    }

    async addHotel(hotel: HotelInfo) {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/hotel`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json; charset=utf-8' },
                body: JSON.stringify(hotel),
            })
        );

        if (wrapper.failed || wrapper.result?.status !== 200) return null;
        return await wrapper.result.json();
    }

    async getReservations(options: { userName?: string, uid?: string }): Promise<ReservationInfo[]> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/reservations?s=${JSON.stringify(options)}`));
        if (wrapper.failed || wrapper.result?.status !== 200) return [];
        return await wrapper.result.json();
    }

    async addReservation(reservation: {
        userName: string,
        hotelUid: string,
        paymentUid: string,
        startDate: string,
        endDate: string
    }): Promise<ReservationInfo> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/reservation`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json; charset=utf-8' },
                body: JSON.stringify(reservation),
            })
        );

        if (wrapper.failed || wrapper.result?.status !== 200) return null;
        return await wrapper.result.json();
    }

    async cancelReservation(uid: string) {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/reservation/${uid}`, { method: 'DELETE' }));
        return wrapper.result?.status === 200;
    }
}
