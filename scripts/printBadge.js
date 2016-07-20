'use strict';
var _ = require('underscore');
var program = require('commander');
var badge = require('../lib/badge');
var config = require('config');
var models = require('../lib/models');

function die(err){
    if (err){
        console.log(err);
        process.exit(1);
    }
    process.exit(0);
}

program
  .version('0.0.1')
  .usage('[options] <eventId> <attendeeId>')
  .option('-e, --events', 'List Events')
  .option('-a, --attendees', 'List Attendees')
  .parse(process.argv);


if (program.events){
    showEvents(die);
} else if (program.attendees){
    var event_id = program.args[0];
    if(! event_id){
        console.log('You must specificy an account id to list attendees');
        die();
    }
    showAttendees(event_id, die);
} else {
    var event_id = program.args[0];
    var attendee_id = program.args[1];

    if (!event_id || ! attendee_id){
        program.help();
    }

    models.event.get(event_id, function(err, event){
        if (err) { die (err); }
        models.attendee.get(attendee_id, function(err, data){
            if (err) {
                console.log(err);
                process.exit(1);
            }
            badge.print(event.badge, data, die);
        });
    });
}

function showEvents(cb){
    console.log('\nEvents:');
    models.event.list(function(err, events){
        if (err) { cb(err); }
        _.each(events, function(event){
            console.log('  ' + event.id + ': ' + event.name);
        });
        console.log();
        cb();
    });
}

function showAttendees(event_id, cb){
    console.log('\nAttendees:');
    models.attendee.listByEvent(event_id, function(err, attendees){
        if (err) { cb(err); }
        _.each(attendees, function(attendee){
            console.log('  ' + attendee.id + ': ' + attendee.name);
        });
        console.log();
        cb();
    });
}

