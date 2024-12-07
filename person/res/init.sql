create table IF NOT EXISTS person
(
    id   serial8      not null
        constraint person_pk
            primary key,
    name varchar(256) not null,
    age int4 null default null,
    address varchar(512) null default null,
    work varchar(256) null default null
);