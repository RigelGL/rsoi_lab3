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

    async getPersonById(id: string): Promise<PersonInfo | null> {
        const wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/api/v1/persons/${id}`));
        if (wrapper.failed || wrapper.result?.status !== 200) return null;
        return await wrapper.result.json();
    }

    async addPerson(request: PersonRequest): Promise<string | null> {
        let wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/api/v1/persons`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json;charset=utf-8' },
                body: JSON.stringify(request),
            }),
            null
        );

        if (wrapper.failed || wrapper.result?.status >= 300) {
            try {
                console.log(await wrapper.result.json());
                return null;
            }
            catch (e) {
                console.log(e);
                return null;
            }
        }
        return (await wrapper.result.json()).id;
    }

    async updatePerson(id: string, request: PersonRequest): Promise<PersonInfo | null> {
        let wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/api/v1/persons/${id}`, {
                method: 'PATCH',
                headers: { 'Content-type': 'application/json;charset=utf-8' },
                body: JSON.stringify(request),
            }),
            null
        );
        if (wrapper.failed || wrapper.result?.status >= 300) return null;
        return await this.getPersonById((await wrapper.result.json()).id);
    }

    async deletePerson(id: string): Promise<boolean> {
        let wrapper = await this.runWithProtect(
            async () => fetch(`${this.url}/api/v1/persons/${id}`, { method: 'DELETE' }),
            null
        );
        return !(wrapper.failed || wrapper.result?.status >= 300);
    }
}