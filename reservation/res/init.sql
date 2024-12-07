create table if not exists hotels
(
    id        serial
        primary key,
    hotel_uid uuid         not null
        unique,
    name      varchar(255) not null,
    country   varchar(80)  not null,
    city      varchar(80)  not null,
    address   varchar(255) not null,
    stars     integer,
    price     integer      not null
);

create table if not exists reservation
(
    id              serial
        primary key,
    reservation_uid uuid        not null
        unique,
    username        varchar(80) not null,
    payment_uid     uuid        not null,
    hotel_id        integer
        references hotels,
    status          varchar(20) not null
        constraint reservation_status_check
            check ((status)::text = ANY ((ARRAY ['PAID'::character varying, 'CANCELED'::character varying])::text[])),
    start_date      timestamp with time zone,
    end_date        timestamp with time zone
);