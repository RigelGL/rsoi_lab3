create table if not exists loyalty
(
    id                serial primary key,
    user_uid          varchar(24)                  not null unique,
    reservation_count integer     default 0        not null,
    status            varchar(16) default 'BRONZE' not null,
    discount          integer                      not null
);
