import { Injectable } from "@nestjs/common";
import { Healthy } from "./Healthy";

@Injectable()
export class LoggerThirdService {
    private readonly url: string;

    constructor() {
        this.url = process.env.LOGGER_URL;
    }


    async getLogs(token: string, search: string) {
        try {
            const resp = await fetch(`${this.url}/logs?s=${search}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
            return await resp.json();
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }
}
