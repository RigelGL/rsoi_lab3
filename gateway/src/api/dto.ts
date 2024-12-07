export class ValidationErrorResponse {
    message: string;
    errors: { field: string, error: string }[];


    constructor(message: string, errors: { field: string; error: string }[] = []) {
        this.message = message;
        this.errors = errors;
    }
}

export type Pagination<T> = {
    page: number;
    pageSize: number;
    totalElements: number;
    items: T[];
};


export type HotelInfo = {
    hotelUid: string;
    name: string;
    country: string;
    city: string;
    address: string;
    fullAddress?: string;
    price: number;
    stars: number;
};


export type PaymentInfo = {
    paymentUid: string;
    status: 'PAID' | 'RESERVED' | 'CANCELED';
    price: number;
};


export type ReservationInfo = {
    reservationUid: string;
    hotel: HotelInfo;
    startDate: string;
    endDate: string;
    status: 'PAID' | 'RESERVED' | 'CANCELED';
    payment: PaymentInfo;
};


export type LoyaltyInfo = {
    status: 'BRONZE' | 'SILVER' | 'GOLD';
    discount: number;
    reservationCount: number;
};


export type PersonRequest = {
    name: string;
    age: number;
    address: string;
    work: string;
}

export type PersonInfo = PersonRequest & {
    id: number;
}

export type UserInfo = PersonInfo & {
    reservations: ReservationInfo[];
    loyalty: Partial<LoyaltyInfo>;
};

export type CreateReservationRequest = {
    hotelUid: string;
    startDate: string;
    endDate: string;
};

export type CreateReservationResponse = {
    reservationUid: string;
    hotelUid: string;
    startDate: string;
    endDate: string;
    discount: number;
    status: 'PAID' | 'RESERVED' | 'CANCELED';
    payment: PaymentInfo;
};