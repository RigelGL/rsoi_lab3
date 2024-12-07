import { Injectable } from "@nestjs/common";
import { PaymentInfo } from "../api/dto";
import { Healthy } from "./Healthy";


@Injectable()
export class PaymentThirdService extends Healthy {

    constructor() {
        super(process.env.PAYMENT_URL, {
            maxFails: 10,
            failTimeoutMs: 60_000,
            afterFailWaitMs: 10_000,
            retryIntervalMs: 3_000,
        });
    }

    private mapPayment(e): PaymentInfo {
        return { paymentUid: e.uid, status: e.status, price: e.price };
    }

    async addPayment(price: number) {
        let wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ price }),
            }),
            null
        );
        if (wrapper.failed || wrapper.result?.status !== 200) return null;

        const uid = (await wrapper.result.json()).uid;

        wrapper = await this.runWithProtect(async () => fetch(`${this.url}/payment/${uid}`));
        if (wrapper.failed || wrapper.result?.status !== 200) return null;

        return this.mapPayment(await wrapper.result.json());
    }

    async getPayments(uids: string[]): Promise<PaymentInfo[]> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/payments?uids=${JSON.stringify(uids)}`),
            null
        );
        if (wrapper.failed || wrapper.result?.status !== 200) return null;
        return (await wrapper.result.json()).map(e => this.mapPayment(e));
    }

    async cancelPayment(uid: string) {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/payment/${uid}`, { method: 'DELETE' }),
            null
        );
        return !wrapper.failed && wrapper.result?.status === 200;
    }
}