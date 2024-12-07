import { Injectable } from "@nestjs/common";
import { ReservationThirdService } from "./third/reservation.third.service";
import { PersonThirdService } from "./third/person.third.service";
import { LoyaltyThirdService } from "./third/loyalty.third.service";


@Injectable()
export class AppService {
    constructor(
        private readonly reservation: ReservationThirdService,
        private readonly person: PersonThirdService,
        private readonly loyalty: LoyaltyThirdService
    ) {
    }

    async prepareMockForTests() {
        await this.person.addPerson({
            name: 'Test Max',
            age: 20,
            work: 'BMSTU',
            address: 'Russia, Moscow'
        });

        await this.loyalty.setForceForUser('Test Max', {
            reservationCount: 25,
            discount: 10,
            status: 'GOLD'
        });

        await this.reservation.addHotel({
            hotelUid: '049161bb-badd-4fa8-9d90-87c9a82b0668',
            name: 'Ararat Park Hyatt Moscow',
            country: 'Россия',
            city: 'Москва',
            address: 'Неглинная ул., 4',
            stars: 5,
            price: 10000
        });
    }
}