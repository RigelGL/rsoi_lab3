import { Injectable } from "@nestjs/common";
import { PersonInfo, PersonRequest } from "../api/dto";
import { Healthy } from "./Healthy";


@Injectable()
export class PersonThirdService extends Healthy {

    constructor() {
        super(process.env.PERSON_URL, {
            maxFails: 5,
            failTimeoutMs: 60_000,
            afterFailWaitMs: 10_000,
            retryIntervalMs: 3_000,
        });
    }

    async getAllRawPersons(): Promise<PersonInfo[]> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/api/v1/persons`));
        if (wrapper.failed || wrapper.result?.status !== 200) return null;
        return await wrapper.result.json();
    }

    async getPersonByName(name: string): Promise<PersonInfo | null> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/api/v1/persons/named?name=${name}`));
        if (wrapper.failed || wrapper.result?.status !== 200) return null;
        return await wrapper.result.json();
    }

    async addPerson(request: PersonRequest): Promise<PersonInfo | null> {
        let wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/api/v1/persons`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json;charset=utf-8' },
                body: JSON.stringify(request),
            }),
            null
        );
        if (wrapper.failed || wrapper.result?.status !== 201) return null;
        return await this.getPersonByName(request.name);
    }
}