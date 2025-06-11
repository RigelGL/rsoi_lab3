import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, QueryRunner } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { AuthRequest } from "./dto";
import { createPrivateKey, createPublicKey, createSign, createVerify, KeyObject } from 'crypto';
import * as fs from 'fs';
import { KafkaService } from "./kafka/kafka.service";

type Oauth = {
    clientId: string;
    clientSecret: string;
};

type UserResponse = {
    sub: string;
    name: string;
    email: string;
    role: string;
}

@Injectable()
export class AppService implements OnModuleInit {
    private yandex: Oauth;
    private google: Oauth;
    private OAUTH_REDIRECT: string;
    private JWT_LIFETIME: number;

    private JWK_PRIVATE: KeyObject;
    private JWK_PUBLIC: KeyObject;
    private JWK_PUBLIC_MOD: string;
    private JWK_PUBLIC_EXP: string;

    private JWT_HEADER: string;

    constructor(@InjectDataSource() private readonly connection: DataSource, private readonly kafka: KafkaService) {

    }

    async onModuleInit() {
        if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET)
            this.yandex = { clientId: process.env.YANDEX_CLIENT_ID, clientSecret: process.env.YANDEX_CLIENT_SECRET };

        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
            this.google = { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET };

        this.OAUTH_REDIRECT = process.env.OAUTH_REDICRECT || 'http://localhost';
        this.JWT_LIFETIME = Math.max(3600, +(process.env.JWT_LIFETIME || 0));

        try {
            const keyFolder = process.env.KEYS_PATH || (__dirname + '/keys');

            const publicKeyPem = fs.readFileSync(keyFolder + '/public_key.pem', 'utf-8');
            this.JWK_PUBLIC = createPublicKey(publicKeyPem);
            const jwk = this.JWK_PUBLIC.export({ format: 'jwk' });
            this.JWK_PUBLIC_MOD = jwk.n || '';
            this.JWK_PUBLIC_EXP = jwk.e || '';

            const privateKeyPem = fs.readFileSync(keyFolder + '/private_key.pem', 'utf-8');
            this.JWK_PRIVATE = createPrivateKey(privateKeyPem);

            this.JWT_HEADER = Buffer.from('{"alg":"RS256","typ":"JWT"}').toString('base64url');

            console.log('RSA KEYS LOADED');
            await this.kafka.sendMessage('RSA KEYS LOADED');
        }
        catch (error) {
            console.log('CANT LOAD KEYS!');
            console.log(error);
            await this.kafka.sendMessage('CANT LOAD KEYS!\n' + error, 'severe')
        }

        console.log(this.yandex ? 'USING YANDEX AUTH' : 'YANDEX AUTH NOT USED');
        console.log(this.google ? 'USING GOOGLE AUTH' : 'GOOGLE AUTH NOT USED');
        console.log(`OAUTH REDIRECT: ${this.OAUTH_REDIRECT}`);
    }

    public getJWKs() {
        return [
            {
                alg: 'RSA',
                mod: this.JWK_PUBLIC_MOD,
                exp: this.JWK_PUBLIC_EXP,
                kid: 'default'
            }
        ];
    }

    getSupportedAuths() {
        const arr: string[] = ['self'];
        if (this.yandex)
            arr.push('yandex');
        if (this.google)
            arr.push('google');
        return arr;
    }

    private genSub(): string {
        let urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
        let sub = ''
        let i = 24;
        while (i--)
            sub += urlAlphabet[(Math.random() * 64) | 0];
        return sub;
    }

    private async getOrCreateAuth0User(provider: string, email: string, name: string, providerId?: string): Promise<null | UserResponse> {
        let runner: null | QueryRunner = null;

        try {
            runner = this.connection.createQueryRunner();
            await runner.query('BEGIN');

            let user: any = null;
            if (provider === 'google') {
                user = (await runner.query('SELECT sub, email, name, role FROM account WHERE google_id = $1', [providerId]))[0];
                if (!user || user?.email !== email || user?.name !== name) {
                    if (!user)
                        await runner.query('INSERT INTO account (sub, name, email, google_id) VALUES ($1, $2, $3, $4)', [this.genSub(), name, email, providerId]);
                    else
                        await runner.query('UPDATE account SET name = $1, email = $2, google_id = $3 WHERE sub = $4', [name, email, providerId, user.id]);

                    user = (await runner.query('SELECT sub, email, name, role FROM account WHERE google_id = $1', [providerId]))[0];
                }
            }
            else if (provider === 'yandex') {
                user = (await runner.query('SELECT sub, email, name, role FROM account WHERE yandex_id = $1 OR email = $2', [providerId, email]))[0];
                if (!user || user?.email !== email || user?.name !== name) {
                    if (!user)
                        await runner.query('INSERT INTO account (sub, name, email, yandex_id) VALUES ($1, $2, $3, $4)', [this.genSub(), name, email, providerId]);
                    else
                        await runner.query('UPDATE account SET name = $1, email = $2, yandex_id = $3 WHERE sub = $4', [name, email, providerId, user.id]);

                    user = (await runner.query('SELECT sub, email, name, role FROM account WHERE yandex_id = $1', [providerId]))[0];
                }
            }

            await runner.query('COMMIT');
            return user;
        }
        catch (error) {
            console.error(error);
        }
        finally {
            try {
                runner?.release();
            }
            catch (error) {
            }
        }
        return null;
    }

    private generateJwt(sub: any, role: string): string {
        const now = new Date();

        const toSign =
            this.JWT_HEADER
            + '.'
            + Buffer.from(JSON.stringify({
                eat: Math.floor(now.getTime() / 1000 + now.getTimezoneOffset() * 60) + this.JWT_LIFETIME,
                sub: `${sub}`,
                role: role || 'user',
            })).toString('base64url');

        const sign = createSign('RSA-SHA256');
        sign.update(toSign);
        sign.end();
        const signature = sign.sign(this.JWK_PRIVATE, 'base64url');
        return toSign + '.' + signature;
    }

    public parseJWT(jwt: string): { [key: string]: string | number } {
        const parts = jwt.split('.');

        if (parts.length !== 3)
            throw new Error('invalid_format');

        const [headerB64, payloadB64, signatureB64] = parts;

        if (headerB64 !== this.JWT_HEADER)
            throw new Error('invalid_header');

        const dataToVerify = `${headerB64}.${payloadB64}`;
        const signature = Buffer.from(signatureB64, 'base64url');

        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));

        const now = new Date();
        const currentSecond = Math.floor(now.getTime() / 1000 + now.getTimezoneOffset() * 60);
        const expiredAt = +payload.eat || 0;

        if (expiredAt < currentSecond)
            throw new Error('expired');

        const verify = createVerify('RSA-SHA256');
        verify.update(dataToVerify);
        verify.end();

        if (!verify.verify(this.JWK_PUBLIC, signature))
            throw new Error('invalid_signature');

        return payload;
    }

    private sanitizeUser(user: UserResponse) {
        return {
            email: user.email,
            name: user.name,
            role: user.role,
            sub: user.sub,
        }
    }

    async authorize(request: AuthRequest): Promise<null | { redirectUrl?: string, jwt?: string, user?: UserResponse, error?: string }> {
        if (request.type === 'yandex') {
            if (!this.yandex)
                return null;

            const basic = 'https://oauth.yandex.ru/authorize?response_type=code';
            const redirectUrl = `${basic}?redirect_url=${this.OAUTH_REDIRECT}&client_id=${this.yandex.clientId}&response_type=code&scope=login:email login:info`;

            await this.kafka.sendMessage('authorize yandex => ' + redirectUrl);
            return { redirectUrl: redirectUrl };
        }

        if (request.type === 'google') {
            if (!this.google)
                return null;

            const basic = 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&scope=openid email profile';
            const redirectUrl = `${basic}&redirect_uri=${this.OAUTH_REDIRECT}&client_id=${this.google.clientId}`;
            await this.kafka.sendMessage('authorize google => ' + redirectUrl);
            return { redirectUrl: redirectUrl };
        }

        if (request.type === 'self') {
            const password = request.password?.trim() || '';
            const login = request.login?.trim() || '';

            if (!password || !login)
                return { error: 'Login and password is required' };

            const user = (await this.connection.query('SELECT sub, email, name, role, password FROM account WHERE email = $1', [login]))[0];
            if (!user)
                return { error: 'Invalid email' };

            if (user.password === null)
                return { error: 'User does not uses password auth' };

            if (user.password.startsWith('plain:')) {
                const password = user.password.substring('plain:'.length);
                if (password !== request.password)
                    return { error: 'invalid password' };

                return { jwt: this.generateJwt(user.sub, user.role), user: this.sanitizeUser(user) };
            }
            return null;
        }

        await this.kafka.sendMessage('try unsupported auth type ' + request.type, 'warning');

        throw new BadRequestException(`Unsupported type, use ${this.getSupportedAuths().join(', ')}`);
    }

    async callback(code: string): Promise<{ error?: string, jwt?: string, user?: UserResponse }> {
        if (code.length > 20) {
            let tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-type': 'application/x-www-form-urlencoded' },
                body: `code=${encodeURI(code)}&client_id=${this.google.clientId}&client_secret=${this.google.clientSecret}&grant_type=authorization_code&redirect_uri=${this.OAUTH_REDIRECT}`
            });

            if (tokenResponse.status !== 200) {
                let error = tokenResponse.status + '';
                try {
                    error += await tokenResponse.text();
                }
                catch (e) {
                }
                await this.kafka.sendMessage('callback error google\n' + error, 'warning');
                return { error: 'bad code' };
            }

            try {
                const token: string = (await tokenResponse.json()).access_token;

                const infoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
                if (infoResponse.status !== 200) {
                    let error = infoResponse.status + '';
                    try {
                        error += await infoResponse.text();
                    }
                    catch (e) {
                    }
                    await this.kafka.sendMessage('callback error google\n' + error, 'warning');

                    return { error: 'bad info' };
                }

                const json: { sub: string, name: string, email: string } = await infoResponse.json();

                const user = await this.getOrCreateAuth0User('google', json.email, json.name, json.sub);

                if (!user) {
                    await this.kafka.sendMessage(`callback no user by google ${json?.sub} / ${json?.email} / ${json?.name}`, 'warning');
                    return { error: 'bad user' };
                }

                return { jwt: this.generateJwt(user.sub, user.role), user: this.sanitizeUser(user) };
            }
            catch (e) {
                console.log(e);
                await this.kafka.sendMessage('google auth error\n' + e, 'warning');
                return { error: 'google error' };
            }
        }
        else if (code.length < 20) {
            let tokenResponse = await fetch('https://oauth.yandex.ru/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${this.yandex.clientId}:${this.yandex.clientSecret}`)
                },
                body: encodeURI(`grant_type=authorization_code&code=${code}&redirect_uri=${this.OAUTH_REDIRECT}`)
            });

            if (tokenResponse.status !== 200) {
                let error = tokenResponse.status + '';
                try {
                    error += await tokenResponse.text();
                }
                catch (e) {
                }
                await this.kafka.sendMessage('callback error yandex\n' + error, 'warning');

                return { error: 'bad code' };
            }

            try {
                const token: string = (await tokenResponse.json()).access_token;

                const infoResponse = await fetch('https://login.yandex.ru/info?format=json', { headers: { 'Authorization': `OAuth ${token}` } });
                if (infoResponse.status !== 200) {
                    let error = infoResponse.status + '';
                    try {
                        error += await infoResponse.text();
                    }
                    catch (e) {
                    }
                    await this.kafka.sendMessage('callback error yandex\n' + error, 'warning');

                    return { error: 'bad info' };
                }

                const json: { id: string, default_email: string, real_name: string } = await infoResponse.json();

                const user = await this.getOrCreateAuth0User('yandex', json.default_email, json.real_name, json.id);

                if (!user) {
                    await this.kafka.sendMessage(`callback no user by yandex ${json?.id} / ${json?.default_email} / ${json?.real_name}`, 'warning');
                    return { error: 'bad user' };
                }

                return { jwt: this.generateJwt(user.sub, user.role), user: this.sanitizeUser(user) };
            }
            catch (e) {
                console.log(e);
                await this.kafka.sendMessage('google auth error\n' + e, 'warning');
                return { error: 'yandex error' };
            }
        }

        await this.kafka.sendMessage('unknown provider for code ' + code);

        return { error: 'unknown provider' };
    }
}
