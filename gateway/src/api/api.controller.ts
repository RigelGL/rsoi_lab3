import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Post,
    Query,
    Headers,
    NotFoundException,
    HttpCode,
    Delete,
    Param,
    BadGatewayException,
    ServiceUnavailableException,
    Req, ForbiddenException, Patch, GoneException
} from '@nestjs/common';
import { Request } from 'express';
import { ApiService } from './api.service';
import { PersonThirdService } from "../third/person.third.service";
import { PaymentThirdService } from "../third/payment.third.service";
import { LoyaltyThirdService } from "../third/loyalty.third.service";
import { ReservationThirdService } from "../third/reservation.third.service";
import { CreateReservationRequest, PersonRequest } from "./dto";
import { CreateReservationWrapper } from "./wrapper";
import { LoggerThirdService } from "../third/logger.third.service";


@Controller('/api/v1')
export class ApiController {
    constructor(
        private readonly service: ApiService,
        private readonly persons: PersonThirdService,
        private readonly payment: PaymentThirdService,
        private readonly loyalty: LoyaltyThirdService,
        private readonly reservation: ReservationThirdService,
        private readonly logger: LoggerThirdService,
    ) {
    }

    // USER
    @Get('me')
    async getMe(@Req() req: Request) {
        const person = await this.service.getMe(req.sub);
        if (!person)
            throw new NotFoundException({ error: 'person not found' });
        return person;
    }

    @Get('reservations')
    async getMyReservations(@Req() req: Request) {
        return await this.service.getMyReservations(req.sub);
    }

    @Get('reservations/:uid')
    async getReservationForUser(@Req() req: Request, @Param('uid') uid: string) {
        const reservation = (await this.service.getReservations({ userUid: req.sub, uid: uid }))[0];
        if (!reservation) throw new NotFoundException();
        return reservation;
    }

    @Get('loyalty')
    async getMyLoyalty(@Req() req: Request) {
        const w = await this.loyalty.getLoyaltyForUser(req.sub);
        if (w.failed) throw new ServiceUnavailableException({ error: 'Loyalty Service unavailable' });
        return w.result;
    }


    // HOTELS
    @Get('hotels')
    async getHotels(@Query() query: { page: number, limit: number, search: string }) {
        const hotels = await this.reservation.getHotels(+query.page || 1, +query.limit || 20, query.search);
        if (!hotels) throw new InternalServerErrorException();
        return hotels;
    }

    // HOTELS
    @Get('hotels/:uid')
    async getHotel(@Param('uid') uid: string) {
        const hotel = await this.reservation.getHotel(uid);
        if (!hotel) throw new InternalServerErrorException();
        return hotel;
    }


    @Post('reservations')
    @HttpCode(200)
    async addReservation(@Req() req: Request, @Body() body: CreateReservationRequest) {
        const res = await this.service.createReservation(req.sub, body);

        if (res.error) {
            const map: Record<CreateReservationWrapper['error'], string> = {
                loyalty: 'Loyalty Service unavailable',
                loyaltyUpd: 'Loyalty Service unavailable',
                hotel: 'Hotel Service unavailable',
                payment: 'Payment Service unavailable',
                reservation: 'Reservation Service unavailable',
            };
            const msg = map[res.error];
            if (res.error === 'hotel')
                throw new NotFoundException({ error: res.error, message: msg });
            throw new ServiceUnavailableException({ error: res.error, message: msg });
        }

        return res.response;
    }

    @Delete('reservations/:uid')
    @HttpCode(204)
    async cancelReservation(@Req() req: Request, @Param('uid') uid: string) {
        const err = await this.service.cancelReservation(req.sub, uid);
        if (err === 'reservation') throw new NotFoundException(err);
        if (err) throw new BadGatewayException(err);
    }


    // ADMIN PERSONS
    @Get('persons')
    async getAllPersons(@Req() req: Request) {
        if (req.role !== 'admin')
            throw new ForbiddenException();
        return await this.persons.getAllRawPersons();
    }

    @Post('person')
    @HttpCode(201)
    async createPerson(@Req() req: Request, @Body() body: PersonRequest) {
        if (req.role !== 'admin')
            throw new ForbiddenException();

        const person = await this.persons.addPerson(body);
        if (!person)
            throw new InternalServerErrorException();
        return person;
    }

    @Patch('person/:id')
    @HttpCode(201)
    async updatePerson(@Req() req: Request, @Param('id') id: string, @Body() body: PersonRequest) {
        if (req.role !== 'admin')
            throw new ForbiddenException();

        const person = await this.persons.updatePerson(id, body);
        if (!person)
            throw new InternalServerErrorException();
        return person;
    }

    @Delete('person/:id')
    @HttpCode(204)
    async deletePerson(@Req() req: Request, @Param('id') id: string) {
        if (req.role !== 'admin')
            throw new ForbiddenException();

        const person = await this.persons.deletePerson(id);
        if (!person)
            throw new InternalServerErrorException();
        return person;
    }


    // ADMIN RESERVATION
    @Get('reservations/all')
    async getAllReservations(@Req() req: Request) {
        if (req.role !== 'admin')
            throw new ForbiddenException();
        return await this.service.getReservations({});
    }


    // ADMIN KAFKA
    @Get('/logs')
    async getLogs(@Req() req: Request, @Query('s') search: string) {
        const e = await this.logger.getLogs(req.jwt, search);
        if (!e)
            throw new BadGatewayException({ error: 'Logger is unavailable' });
        return e;
    }
}
