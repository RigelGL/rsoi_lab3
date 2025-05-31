import { ThirdWrapper } from "./ThirdWrapper";

export type HealthyConfig = {
    maxFails: number;
    failTimeoutMs: number;
    afterFailWaitMs: number;
    retryIntervalMs: number;
}

export class Healthy {
    protected readonly url: string;
    private state: 'NORMAL' | 'FAILED' | 'TESTING';
    private fails: number [];
    private testingTimeout: any;
    private readonly config: HealthyConfig;

    constructor(url: string, config: HealthyConfig) {
        this.url = url;
        this.state = 'NORMAL';
        this.config = config;
        this.fails = [];
    }

    private async checkHealth() {
        try {
            return (await fetch(`${this.url}/manage/health}`)).status === 200;
        }
        catch (e) {
            return false;
        }
    }

    private processFailed() {
        if (this.testingTimeout) return;

        const min = this.fails[this.fails.length - 1] - this.config.failTimeoutMs;
        this.fails = this.fails.filter(e => e > min);

        // fail rate > max fails per time
        if (this.fails.length >= this.config.maxFails) {
            this.state = 'FAILED';
            this.testingTimeout = setTimeout(this.retry.bind(this), this.config.afterFailWaitMs);
        }
    }

    private async retry() {
        this.state = 'TESTING';
        if (await this.checkHealth()) {
            this.state = 'NORMAL';
            return;
        }
        // test again
        this.testingTimeout = setTimeout(this.retry.bind(this), this.config.retryIntervalMs);
    }

    protected async runWithProtect(fun: any, failBack: any = null): Promise<ThirdWrapper<Response>> {
        if (this.state === 'FAILED' || this.state === 'TESTING')
            return { result: failBack, failed: true };

        try {
            return { result: await fun(), failed: false };
        }
        catch (e) {
            this.fails.push(Date.now());
            this.processFailed();
            console.log(e);
            return { result: failBack, failed: true };
        }
    }
}