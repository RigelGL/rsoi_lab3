import { Controller, ForbiddenException, HttpCode, Post, Query, Req } from '@nestjs/common';
import { AppService } from "./app.service";
import { Request } from "express";


@Controller()
export class TestController {
    constructor(private readonly service: AppService) {
    }

    @HttpCode(200)
    @Post('/api/v1/test/prepare')
    async prepareTestMock(@Req() req: Request) {
        if (req.role !== 'admin')
            throw new ForbiddenException({ error: 'admin only', status: 'ERROR' });

        await this.service.prepareMockForTests();
        return { status: 'PREPARED' };
    }
}
