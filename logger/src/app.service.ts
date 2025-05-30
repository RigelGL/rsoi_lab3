import { Injectable, OnModuleInit } from '@nestjs/common';
import { LogEntity } from "./entity";
import { Like, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { KafkaService } from "./kafka.service";

@Injectable()
export class AppService implements OnModuleInit {
    constructor(
        @InjectRepository(LogEntity) private readonly logRepository: Repository<LogEntity>,
        private readonly kafkaService: KafkaService,
    ) {
    }

    async onModuleInit() {
        console.log('starting')
        await this.kafkaService.consume(async (timestamp, log: { service: string, level: string, message: string }) => {
            if (log.service && log.level && log.message) {
                try {
                    await this.logRepository.save({
                        timestamp: new Date(+timestamp),
                        service: log.service,
                        level: log.level,
                        message: log.message,
                    });
                }
                catch (e) {
                    console.log(e);
                }
            }
        });
    }

    async find(query: { service?: string; level?: string; message?: string, limit?: number, page?: number } = {}) {
        const limit = Math.min(1000, Math.max(1, query.limit || 20));
        const page = Math.max(1, query.page || 1) - 1;

        const where = {};
        if (query.service) where['service'] = Like(`%${query.service}%`);
        if (query.level) where['level'] = Like(`%${query.level}%`);
        if (query.message) where['message'] = Like(`%${query.message}%`);
        const [items, count] = await this.logRepository.findAndCount({ where, take: limit, skip: page * limit, order: { id: 'desc' } });

        return {
            items,
            count,
        }
    }
}
