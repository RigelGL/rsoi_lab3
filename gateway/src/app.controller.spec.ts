import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';


describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({ controllers: [AppController] }).compile();
        appController = app.get(AppController);
    });

    it('should return "OK"', () => {
        expect(appController.checkHealth()).toBe('OK');
    });
});