import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthRequest } from "./dto";

@Controller('/')
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @Get('supported')
    async getSupportedAuths() {
        return this.appService.getSupportedAuths();
    }

    @Get('test')
    async getTestAuths() {
        return `<html lang=ru>
<head>
    <style>label {
        display: block;
        margin-bottom: 8px;
    }</style>
</head>
<body>
<div style="margin: 50px auto; width: 300px">
    <label>email<input type="text" id="login"></label>
    <label>password<input type="password" id="password"></label>
    <div id="error" style="color: #aa0000"></div>
    <input type="button" value="login" onclick="login()">
</div>
<div style="margin: 50px auto; width: 300px">
    <input type="button" value="Login via Yandex" onclick="login2('yandex')">
    <input type="button" value="Login via Google" onclick="login2('google')">
    <div id="error2" style="color: #aa0000"></div>
</div>
<script>
    function ge(e) {
        return document.getElementById(e);
    }

    function login() {
        fetch('/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ type: 'self', login: ge('login').value, password: ge('login').value })
        }).then(res => res.json().then(e => {
            if (res.status === 200) window.location.href = '/';
            else ge('error').innerText = e.error;
        })).catch(err => console.log(err));
    }

    function login2(type) {
        fetch('/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ type: type })
        }).then(res => res.json().then(e => {
            if (res.status === 200) window.location.href = e.redirectUrl;
            else ge('error2').innerText = e.error;
        })).catch(err => console.log(err));
    }
</script>
</body>
</html>`;
    }

    @Get('well-known')
    async getJwks() {
        return this.appService.getJWKs();
    }

    @Post('authorize')
    @HttpCode(200)
    async provideAuth(@Body() body: AuthRequest) {
        const res = await this.appService.authorize(body);
        if (res === null || res.error)
            throw new BadRequestException({ error: res?.error || 'unsupported auth' });
        return res;
    }

    @Post('verify')
    @HttpCode(200)
    async verifyToken(@Body() body: { token: string }) {
        try {
            const res = this.appService.parseJWT(body.token || '');
            return { payload: res };
        }
        catch (e) {
            throw new BadRequestException({ error: e.message });
        }
    }

    @Get('callback')
    async redirectedAuth(@Query('code') code: string) {
        const res = await this.appService.callback(code);
        if(!res || res.error)
            throw new BadRequestException({ error: res?.error || 'bad auth' });
        return res;
    }

    @Get('manage/health')
    getHello() {
        return 'OK';
    }
}
