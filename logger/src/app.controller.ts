import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @Get('/logs')
    async searchLogs(@Query('s') query: string) {
        return await this.appService.find(JSON.parse(query || '{}'));
    }

    @Get('/manage/health')
    async health() {
        return 'OK';
    }
}
