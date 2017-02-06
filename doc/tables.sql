create table importers
(
    id serial,
    name character varying (80) not null,
    rules jsonb,
    primary key (id),
    CONSTRAINT importer_name_ukey UNIQUE (name)
);

insert into importers (name, rules) values ('intercon', '{"attendee":{"name":{"field":["FirstName"," ","LastName"],"type":"name"},"badgename":{"field":"Nickname","display":true},"type":{"field":"Status","map":{"Alumni":"Unpaid"},"display":true,"type":"type"},"email":{"field":"EMail","type":"email"},"pronouns":{"field":"PreferredCharacterGender","map":{"Male":"He/Him/His","Female":"She/Her/Hers"},"type":"pronouns","display":true}},"notes":[{"field":"IsGM","map":{"0":"","1":"Is a GM, gets a patch"}},{"field":"ShirtOrder"}]}');


CREATE TABLE events
(
    id serial,
    name character varying(255),
    description text,
    badge jsonb,
    importer_id int,
    created timestamp with time zone NOT NULL DEFAULT now(),
    primary key (id),
    CONSTRAINT event_name_ukey UNIQUE (name),
    CONSTRAINT "event_importer_fkey" FOREIGN KEY ("importer_id")
        REFERENCES importers ("id") MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE TABLE users
(
    id serial,
    name character varying(120),
    username character varying(100),
    password character varying(200),
    admin boolean default false,
    current_event_id int,
    locked boolean default false,
    created timestamp with time zone NOT NULL DEFAULT now(),
    primary key (id),
    CONSTRAINT user_username_uk UNIQUE(username),
    CONSTRAINT "user_event_fkey" FOREIGN KEY ("current_event_id")
        REFERENCES events ("id") MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL
);

-- Admin user:  admin/admin
insert into users (name, username, password, admin)
    values ('Administrator', 'admin', 'c2NyeXB0AA4AAAAIAAAAAXtV7XSrMTXwRi68kGZ+NWDQtHvijDB79Mfc2fI6FPAGDvqGuqDaHri4DlGK3IXj+llh66JyroPRbBrra9lNU8KW5LgsVK+1IVgWgNBIGifX', true);


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
    registered boolean default false,
    type character varying(120),
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
    primary key (id),
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

create table pronouns
(
    id serial,
    values character varying(255),
    freeform boolean default false,
    primary key (id)
);
insert into pronouns (values, freeform) values ('She/Her/Hers', false);
insert into pronouns (values, freeform) values ('He/Him/His', false);
insert into pronouns (values, freeform) values ('They/Them/Theirs', false);
insert into pronouns (values, freeform) values ('No pronouns, use my name', false);
insert into pronouns (values, freeform) values ('Other', true);
