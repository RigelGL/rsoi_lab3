import { Controller, Get } from '@nestjs/common';


@Controller()
export class AppController {
    constructor() {
    }

    @Get('/manage/health')
    checkHealth() {
        return 'OK';
    }
}
