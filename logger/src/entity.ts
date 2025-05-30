import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('logs')
export class LogEntity {
    @PrimaryGeneratedColumn() id: number;
    @Column() timestamp: Date;
    @Column() service: string;
    @Column() level: string;
    @Column() message: string;
}
