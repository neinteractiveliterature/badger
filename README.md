# Badger
a badge printing server for conventions

## Overview
This software is meant to be run on a print server, connected to at least one badge printer in order to run check-in for a convention.  It has no dependncy on the internet after install time, so it can be run in a off-line environment.

## Features
It supports
* Multiple Events
* User Permissioning
    * Admin User - All privs
    * Event User - Create/Edit Attendees for a event (granted per-event)
    * Event Admin - Import data, modify badge layout, view audit log for an event (granted per-event)
* Custom attendee fields per event
* Custom importers
* Custom badge layout
    * Text positioning
    * Text Sizing
    * Automatic shrink text to fit
    * Font support
    * Style support

* Import attendee data from CSV
    * via CLI tool
    * via Website (in progress)
* Per-attendee check-in notes
* Add attendees at the door
* Simple search interface for checking in attendees
* Search/filter/sortable lists for attendees, users, events
* Audit trail of all activity
* Audit event viewer/exporter (in progress)
* User mananement via GUI

## Instalation

```
# git clone https://github.com/dkapell/badger.git badger
# cd badger && npm install
# psql -f doc/create_database
# psql -U badger badger doc/tables.sql
# pm2 start badger.pm2.json
# pm2 save
```

## TODO
* All of the above marked in progress
    * checkin notes
        * create
        * edit
    * Import via website
    * Image support for badges
    * delete users
    * delete attendees
    * delete events

* support imported ids?
