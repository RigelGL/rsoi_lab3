import { Injectable } from "@nestjs/common";
import { Healthy } from "./Healthy";

@Injectable()
export class AuthThirdService extends Healthy {

    constructor() {
        super(process.env.AUTH_URL, {
            maxFails: 10,
            failTimeoutMs: 60_000,
            afterFailWaitMs: 10_000,
            retryIntervalMs: 3_000,
        });
    }


    async authorize(body: any) {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/authorize`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(body || {})
            }));
        if (wrapper.failed || wrapper.result?.status !== 200) {
            try {
                return { failed: true, result: await wrapper.result.json() };
            }
            catch (e) {
                console.log(e);
                return { failed: true, result: null };
            }
        }
        return { result: await wrapper.result.json() };
    }

    async callback(code: string) {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/callback?code=${code}`));
        if (wrapper.failed || wrapper.result?.status !== 200) {
            try {
                return { failed: true, result: await wrapper.result.json() };
            }
            catch (e) {
                console.log(e);
                return { failed: true, result: null };
            }
        }
        return { result: await wrapper.result.json() };
    }

    async verify(token: string) {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/verify`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify({ token })
            }));

        if (wrapper.failed)
            return { failed: true, result: null };

        try {
            return { failed: false, result: await wrapper.result.json() };
        }
        catch (e) {
            console.log(e);
            return { failed: true, result: null };
        }
    }
}
