import { Body, Controller, Get, HttpCode, InternalServerErrorException, Post, Query } from '@nestjs/common';
import { AuthThirdService } from "./third/auth.third.service";
import { PersonThirdService } from "./third/person.third.service";


@Controller()
export class AppController {
    constructor(
        private readonly service: AuthThirdService,
        private readonly persons: PersonThirdService,
    ) {
    }

    @HttpCode(200)
    @Post('/api/v1/authorize')
    async authorize(@Body() body: { type: string, login: string, password: string }): Promise<any> {
        const result = await this.service.authorize(body);
        if (result.failed || !result.result)
            throw new InternalServerErrorException({ error: result.result?.error || 'failed to authorize' });

        return result.result;
    }

    @Get('/api/v1/callback')
    async callback(@Query('code') code): Promise<any> {
        const result = await this.service.callback(code);

        if (result.failed || !result.result)
            throw new InternalServerErrorException({ error: result.result?.error || 'failed to callback' });

        const jwt = result.result.jwt;
        const user: { sub: string, name: string } = result.result.user;

        const person = await this.persons.getPersonById(user.sub);
        if (person === null)
            await this.persons.addPerson({ id: user.sub, name: user.name, age: 0, address: '', work: '' });

        return { token: jwt };
    }

    @Get('/manage/health')
    checkHealth() {
        return 'OK';
    }
}
