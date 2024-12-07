create table if not exists loyalty
(
    id                serial
        primary key,
    username          varchar(80)                                     not null
        unique,
    reservation_count integer     default 0                           not null,
    status            varchar(80) default 'BRONZE'::character varying not null
        constraint loyalty_status_check
            check ((status)::text = ANY ((ARRAY ['BRONZE'::character varying, 'SILVER'::character varying, 'GOLD'::character varying])::text[])),
    discount          integer                                         not null
);
