export class AuthRequest {
    type: 'self' | 'yandex' | 'google';

    login: string;
    password: string;
}