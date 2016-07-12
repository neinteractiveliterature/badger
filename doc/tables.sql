CREATE TABLE users
(
    id serial,
    name character varying(120),
    username character varying(20),
    password character varying(200),
    admin boolean default false,
    created timestamp with time zone NOT NULL DEFAULT now(),
    primary key (id),
    CONSTRAINT user_username_uk UNIQUE(username)
);

CREATE TABLE events
(
    id serial,
    name character varying(255),
    description text,
    badge jsonb,
    created timestamp with time zone NOT NULL DEFAULT now(),
    primary key (id),
    CONSTRAINT event_name_ukey UNIQUE (name)
);

CREATE TABLE events_users
(
    user_id integer not null,
    event_id integer not null,
    admin boolean default false,
    primary key (user_id, event_id),
    CONSTRAINT "event_user_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES users ("id") MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT "event_user_event_id_fkey" FOREIGN KEY ("event_id")
        REFERENCES events ("id") MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE attendees
(
    id serial,
    email character varying(120),
    name character varying(255),
    event_id integer not null,
    data jsonb,
    badged boolean default false,
    checked_in boolean default false,
    created timestamp with time zone NOT NULL DEFAULT now(),
    primary key (id),
    CONSTRAINT attendee_email_event_ukey UNIQUE (email, event_id),
    CONSTRAINT "attendee_event_fkey" FOREIGN KEY ("event_id")
        REFERENCES events ("id") MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX attendee_data_gin ON attendees USING gin (data);


create table notes
(
    id serial,
    attendee_id integer not null,
    contents text,
    cleared boolean default false,
    created timestamp with time zone NOT NULL DEFAULT now(),
    primary key (id);
    CONSTRAINT "node_attendee_id_fkey" FOREIGN KEY ("attendee_id")
        REFERENCES attendees ("id") MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
);

create table audits
(
    id serial,
    user_id integer not null,
    action character varying (80),
    object_type character varying(20),
    object_id integer,
    data jsonb,
    created timestamp with time zone NOT NULL DEFAULT now(),
    primary key (id),
    CONSTRAINT "audit_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES users ("id") MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE

);
