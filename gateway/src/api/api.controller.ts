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
    GoneException,
    ServiceUnavailableException
} from '@nestjs/common';
import { ApiService } from './api.service';
import { PersonThirdService } from "../third/person.third.service";
import { PaymentThirdService } from "../third/payment.third.service";
import { LoyaltyThirdService } from "../third/loyalty.third.service";
import { ReservationThirdService } from "../third/reservation.third.service";
import { CreateReservationRequest, CreateReservationResponse, PersonRequest } from "./dto";
import { CreateReservationWrapper } from "./wrapper";


@Controller('/api/v1')
export class ApiController {
    constructor(
        private readonly service: ApiService,
        private readonly persons: PersonThirdService,
        private readonly payment: PaymentThirdService,
        private readonly loyalty: LoyaltyThirdService,
        private readonly reservation: ReservationThirdService,
    ) {
    }

    // USER
    @Get('me')
    async getMe(@Headers('X-User-Name') name: string) {
        const person = await this.service.getMe(name);
        if (!person)
            throw new NotFoundException();
        return person;
    }

    @Get('reservations')
    async getMyReservations(@Headers('X-User-Name') name: string) {
        return await this.service.getMyReservations(name);
    }

    @Get('reservations/:uid')
    async getReservationForUser(@Headers('X-User-Name') name: string, @Param('uid') uid: string) {
        const reservation = (await this.service.getReservations({ userName: name, uid: uid }))[0];
        if (!reservation) throw new NotFoundException();
        return reservation;
    }

    @Get('loyalty')
    async getMyLoyalty(@Headers('X-User-Name') name: string) {
        const w = await this.loyalty.getLoyaltyForUser(name);
        if (w.failed) throw new ServiceUnavailableException('Loyalty Service unavailable');
        return w.result;
    }


    // HOTELS
    @Get('hotels')
    async getHotels(@Query() query: { page: number, size: number }) {
        const hotels = await this.reservation.getHotels(+query.page || 1, +query.size || 20);
        if (!hotels) throw new InternalServerErrorException();
        return hotels;
    }


    @Post('reservations')
    @HttpCode(200)
    async addReservation(@Headers('X-User-Name') name: string, @Body() body: CreateReservationRequest) {
        const res = await this.service.createReservation(name, body);


        if (res.error) {
            const map: Record<CreateReservationWrapper['error'], string> = {
                loyalty: 'Loyalty Service unavailable',
                loyaltyUpd: 'Loyalty Service unavailable',
                hotel: 'Hotel Service unavailable',
                payment: 'Payment Service unavailable',
                reservation: 'Reservation Service unavailable',
            };
            const msg = map[res.error];
            if (res.error === 'hotel') throw new NotFoundException(msg);
            throw new ServiceUnavailableException(msg);
        }

        return res.response;
    }

    @Delete('reservations/:uid')
    @HttpCode(204)
    async cancelReservation(@Headers('X-User-Name') name: string, @Param('uid') uid: string) {
        const err = await this.service.cancelReservation(name, uid);
        if (err === 'reservation') throw new NotFoundException(err);
        if (err) throw new BadGatewayException(err);
    }


    // PERSONS
    @Get('rawPersons')
    async getAllPersons() {
        return await this.persons.getAllRawPersons();
    }

    @Post('person')
    @HttpCode(201)
    async createPerson(@Body() body: PersonRequest) {
        const person = await this.persons.addPerson(body);
        if (!person)
            throw new InternalServerErrorException();
        return person;
    }
}
