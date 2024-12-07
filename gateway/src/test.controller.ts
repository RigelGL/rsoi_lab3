import { Controller, Post } from '@nestjs/common';
import { AppService } from "./app.service";


@Controller()
export class TestController {
    constructor(private readonly service: AppService) {
    }

    @Post('/test/prepare')
    async prepareTestMock() {
        await this.service.prepareMockForTests();
        return { status: 'PREPARED' };
    }
}
