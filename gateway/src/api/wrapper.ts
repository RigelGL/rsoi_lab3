import { CreateReservationResponse } from "./dto";

export type CreateReservationWrapper = Partial<{
    response: CreateReservationResponse;
    error: 'hotel' | 'loyalty' | 'loyaltyUpd' | 'payment' | 'reservation';
}>;