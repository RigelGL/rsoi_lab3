import { Injectable } from '@nestjs/common';
import { LoyaltyInfo } from "../api/dto";
import { Healthy } from "./Healthy";
import { ThirdWrapper } from "./ThirdWrapper";

@Injectable()
export class LoyaltyThirdService extends Healthy {

    constructor() {
        super(process.env.LOYALTY_URL, {
            maxFails: 10,
            failTimeoutMs: 60_000,
            afterFailWaitMs: 10_000,
            retryIntervalMs: 3_000,
        });
    }

    getDefaultFallback(): LoyaltyInfo {
        return {
            reservationCount: 0,
            discount: 5,
            status: 'BRONZE',
        }
    }

    async getLoyaltyForUser(userUid: string): Promise<ThirdWrapper<LoyaltyInfo>> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/loyalty?userUid=${userUid}`));

        if (wrapper.failed) return { failed: true, result: this.getDefaultFallback() };
        if (wrapper.result?.status !== 200) return { failed: false, result: null };
        return { result: await wrapper.result.json() };
    }

    async changeLoyaltyStatus(userUid: string, type: 'inc' | 'dec') {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/update?userUid=${userUid}&type=${type}`, { method: 'POST' }));
        return wrapper.result?.status === 200;
    }

    async setForceForUser(userUid: string, info: LoyaltyInfo) {
        const wrapper = await this.runWithProtect(async () => fetch(
            `${this.url}/force?userUid=${userUid}&reservations=${info.reservationCount}&discount=${info.discount}&status=${info.status}`,
            { method: 'POST' }
        ));
        return wrapper.result?.status === 200;
    }
}
