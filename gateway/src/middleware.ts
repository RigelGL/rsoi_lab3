import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthThirdService } from "./third/auth.third.service";


@Injectable()
export class AuthMiddleware implements NestMiddleware {
    anonymousUrls: string[];

    constructor(private readonly service: AuthThirdService) {
        this.anonymousUrls = ['/api/v1/authorize', '/api/v1/callback', '/api/v1/refreshTokens'];
    }

    use(req: Request, res: Response, next: NextFunction) {
        const url = req.originalUrl.split(/([#?])/)[0];
        if (url.startsWith('/api/') && !this.anonymousUrls.includes(url)) {

            if (!req.headers.authorization?.startsWith('Bearer '))
                throw new BadRequestException({ error: 'Not authorized. Use Authorization: Bearer ...' });

            const token = req.headers.authorization.split(' ')[1];

            this.service.verify(token).then(resp => {
                const payload = resp.result?.payload;
                if (!payload)
                    return res.status(401).json({ error: resp.result?.error || 'unauthorized' }).end();

                req.jwt = token;
                req.sub = payload.sub;
                req.role = payload.role;
                next();
            });
        }
        else
            next();
    }
}
