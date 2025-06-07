import { BadGatewayException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateReservationRequest, HotelInfo, Pagination, PaymentInfo, ReservationInfo, UserInfo, ValidationErrorResponse } from "./dto";
import { PersonThirdService } from "../third/person.third.service";
import { PaymentThirdService } from "../third/payment.third.service";
import { LoyaltyThirdService } from "../third/loyalty.third.service";
import { ReservationThirdService } from "../third/reservation.third.service";
import { CreateReservationWrapper } from "./wrapper";

@Injectable()
export class ApiService {
    private cancelReservationsQueue: { paymentUid: string, userUid: string }[];

    constructor(
        private readonly persons: PersonThirdService,
        private readonly payment: PaymentThirdService,
        private readonly loyalty: LoyaltyThirdService,
        private readonly reservation: ReservationThirdService,
    ) {
        this.cancelReservationsQueue = [];

        // очередь отмен платежей и снижения лояльности
        const cancellationQueueExecutor = async () => {
            let i = 0;
            // пока не дошли до конца очереди отмен
            while (i < this.cancelReservationsQueue.length) {
                // следующее удаляемое
                const e = this.cancelReservationsQueue[i];

                // нужно отменить оплату
                if (e.paymentUid) {
                    if (await this.payment.cancelPayment(e.paymentUid))
                        e.paymentUid = null;
                }

                // нужно понизить лояльность
                if (e.userUid) {
                    if (await this.loyalty.changeLoyaltyStatus(e.userUid, 'dec'))
                        e.userUid = null;
                }

                if (!e.paymentUid && !e.userUid)
                    this.cancelReservationsQueue.splice(i, 1);
                else
                    i++;
            }

            setTimeout(cancellationQueueExecutor, 10_000);
        };

        setTimeout(cancellationQueueExecutor, 1000)
    }


    async getMe(userUid: string): Promise<UserInfo> {
        console.log('getme ' + userUid);
        const user = await this.persons.getPersonById(userUid) as UserInfo;
        if (!user)
            return null;

        user.reservations = await this.getMyReservations(userUid) || [];
        const loyaltyWrapper = (await this.loyalty.getLoyaltyForUser(userUid));
        user.loyalty = loyaltyWrapper.result;

        return user;
    }

    async getMyReservations(userUid: string): Promise<ReservationInfo[]> {
        return await this.getReservations({ userUid });
    }

    async getReservations(options: { userUid?: string, uid?: string, page?: number, limit?: number }): Promise<ReservationInfo[]> {
        const reservations = await this.reservation.getReservations(options);

        const payments = new Map<string, PaymentInfo>();
        (await this.payment.getPayments(reservations.map(e => e.payment.paymentUid)))
            ?.map(e => payments.set(e.paymentUid, e));

        reservations.forEach(e => e.payment = payments.get(e.payment.paymentUid) || e.payment);
        return reservations;
    }


    async createReservation(userUid: string, body: CreateReservationRequest): Promise<CreateReservationWrapper> {
        const hotel = await this.reservation.getHotel(body.hotelUid);
        // нет отеля
        if (!hotel) return { error: 'hotel' };

        const loyaltyWrapper = await this.loyalty.getLoyaltyForUser(userUid);
        // сервис лояльности недоступен
        if (loyaltyWrapper.failed) return { error: 'loyalty' };

        let start = new Date(body.startDate);
        let end = new Date(body.endDate);
        if (start > end) {
            const tmp = start;
            start = end;
            end = tmp;
        }
        const deltaDays = (+end - +start) / 86400_000 + 1;

        const prisePerDay = Math.ceil(hotel.price * (1 - loyaltyWrapper.result.discount / 100));
        const resultPrice = deltaDays * prisePerDay;

        const payment = await this.payment.addPayment(resultPrice);

        // сервис оплаты недоступен
        if (!payment) return { error: 'payment' };

        const reservation = await this.reservation.addReservation({
            userUid: userUid,
            hotelUid: hotel.hotelUid,
            paymentUid: payment.paymentUid,
            startDate: start.toISOString().substring(0, 10),
            endDate: end.toISOString().substring(0, 10),
        });

        // сервис резервирования недоступен - отменяем оплату
        if (!reservation) {
            await this.payment.cancelPayment(payment.paymentUid);
            return { error: 'reservation' };
        }

        // сервис лояльности недоступен - отменяем оплату и резервирование
        if (!await this.loyalty.changeLoyaltyStatus(userUid, 'inc')) {
            await this.payment.cancelPayment(payment.paymentUid);
            await this.reservation.cancelReservation(reservation.reservationUid);
            return { error: 'loyaltyUpd' };
        }

        return {
            response: {
                reservationUid: reservation.reservationUid,
                hotelUid: hotel.hotelUid,
                startDate: reservation.startDate,
                endDate: reservation.endDate,
                discount: loyaltyWrapper.result.discount,
                status: reservation.status,
                payment: payment,
            }
        }
    }

    async cancelReservation(userUid: string, uid: string) {
        const reservation = (await this.reservation.getReservations({ userUid: userUid, uid }))[0];

        if (!reservation || reservation.status === 'CANCELED')
            return 'reservation';

        if (!await this.reservation.cancelReservation(uid))
            return 'cancelReservation';

        if (!await this.payment.cancelPayment(reservation.payment.paymentUid)) {
            console.log('Cant cancel payment, add to QUEUE');
            this.cancelReservationsQueue.push({ paymentUid: reservation.payment.paymentUid, userUid: userUid });
            return null;
        }
        if (!await this.loyalty.changeLoyaltyStatus(userUid, 'dec')) {
            console.log('Cant cancel payment, add to QUEUE');
            this.cancelReservationsQueue.push({ paymentUid: null, userUid: userUid });
            return null;
        }
        return null;
    }
}
