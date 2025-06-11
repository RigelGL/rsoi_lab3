import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthThirdService } from "./third/auth.third.service";
import { createPublicKey, createVerify } from "crypto";


@Injectable()
export class AuthMiddleware implements NestMiddleware {
    anonymousUrls: string[];

    private JWT_HEADER: string;
    private JWK_PUBLIC: any;

    constructor(private readonly service: AuthThirdService) {
        this.anonymousUrls = ['/api/v1/authorize', '/api/v1/callback', '/api/v1/refreshTokens'];

        this.JWT_HEADER = Buffer.from('{"alg":"RS256","typ":"JWT"}').toString('base64url');

        if (process.env.JWKS) {
            try {
                fetch(process.env.JWKS).then(async e => {
                    if (e.status === 200) {
                        const resp = (await e.json())[0];
                        this.JWK_PUBLIC = createPublicKey(resp.raw);
                        console.log('public key set!');
                    }
                });
            } catch (e) {
            }
        }
    }

    private parseJWT(jwt: string): { [key: string]: any } {
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

    use(req: Request, res: Response, next: NextFunction) {
        console.log(`${req.method} ${req.originalUrl}`);

        const url = req.originalUrl.split(/([#?])/)[0];
        if (url.startsWith('/api/') && !this.anonymousUrls.includes(url)) {
            if (!req.headers.authorization?.startsWith('Bearer '))
                throw new BadRequestException({ error: 'Not authorized. Use Authorization: Bearer ...' });

            const token = req.headers.authorization.split(' ')[1];

            try {
                const payload = this.parseJWT(token);

                req.jwt = token;
                req.sub = payload.sub;
                req.role = payload.role;

                next();
            } catch (e) {
                return res.status(401).json({ error: e?.message || 'unauthorized' }).end();
            }


            // this.service.verify(token).then(resp => {
            //     const payload = resp.result?.payload;
            //     if (!payload)
            //         return res.status(401).json({ error: resp.result?.error || 'unauthorized' }).end();
            //
            //     req.jwt = token;
            //     req.sub = payload.sub;
            //     req.role = payload.role;
            //     next();
            // });
        } else
            next();
    }
}
