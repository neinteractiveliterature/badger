# Badger
a badge printing server for conventions

## Overview
This software is meant to be run on a print server, connected to at least one badge printer in order to run check-in for a convention.  It has no dependncy on the internet after install time, so it can be run in a off-line environment.

## Features
It supports
* Multiple Events
* User Permissioning
    * Locked - no access
    * Admin User - All privs for all events, create events, create/manage users
    * Event User - Create/Edit Attendees for a event, check in attendees, create/edit/clear notes (granted per-event)
    * Event Admin - Import data, modify badge layout, view audit log for an event (granted per-event)
* Custom attendee fields per event
* Custom importers
* Custom badge layout
    * Text positioning
    * Text Sizing
    * Automatic shrink text to fit
    * Font support
    * Style support
* Import attendee data from CSV via CLI tool
* Per-attendee check-in notes
* Add attendees at the door
* Provides a Simple search interface for checking in attendees
* Search/filter/sortable lists for attendees, users, events
* Audit trail of all activity
* User mananement via GUI
* Printer management via GUI - Round Robin Printing on all active printers, clear queues


## TODO
* Import attendees via website
* Image support for badges
* delete attendees
* delete events
* support imported ids?
* documentation

## Glossary

Event
: A convention, conference, etc

User
: A login to Badger, for event/user/attendee administration

Attendee
: A record for a person attending an Event.  Attendee records belong to a single event, even if they represent a person registered for more than one.

Importer
: A set of rules for importing Attendee data into a Event

## Admin Guide
Admins have access to all events, and all functions and can manage users

### Printer setup
* Add printer to computer
* Make sure printer has the correct ribbon type selected. (B/W or Color)
* adjust for landscape if needed (Set env variable BADGER_LANDSCAPE=true)
* set printer name in env variable BADGER_PRINTER

### Instalation
```
# git clone https://github.com/dkapell/badger.git badger
# cd badger && npm install
# sudo -u postgres psql -f doc/create_database.sql
# psql -U badger badger -f doc/tables.sql
# pm2 start badger.pm2.json
# pm2 save
```
### Users
### Importers
### Event

## Event Admin Guide
Event Admins
### Event
### Attendee

## User Guide
### Checking in a Attendee
