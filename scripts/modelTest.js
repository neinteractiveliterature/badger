'use strict';
var _ = require('underscore');
var config = require('config');
var async = require('async');

var models = require('../lib/models');

var badge = [
    {
        name: 'mainName',
        dataField: ['badgename', 'name'],
        x: 'center',
        y: 'center',
        align: 'center',
        size: 14,
        font: '/Users/dkapell/Library/Fonts/Windlass.ttf',
    },
    {
        name: 'secondName',
        dataField: 'name',
        exclusive: true,
        x: 'center',
        y: 85,
        align: 'center',
        size: 12,
    },
    {
        name: 'pronouns',
        x: 'center',
        y: 100,
        align: 'center',
        size: 10,
    },
    {
        name: 'extra',
        x: 'center',
        y: 120,
        align: 'center',
        size: 10,
        font: '/Library/Fonts/Arial Black.ttf',
    },
    {
        name: 'id',
        x: 'margin',
        y: '-margin',
        size: 6,
        align: 'left'
    },
    {
        name: 'type',
        x: 'margin',
        y: '-margin',
        size: 6,
        align:'right'
    }
];


function die(err){
    console.log(err);
    process.exit(1);
}
//attendee.create(data, display);
//attendee.search('rig', display);
//attendee.search('gmail', display);
/*attendee.get(2, function(err, user){
    if (err){ die(err); }
    user.data.type = 'Paid';
    user.badged = true;
    user.email = 'kimsward@gmail.com';
    delete user.data.badgename;
    attendee.update(2, user, function(err){
        if (err) { die(err); }
        attendee.get(2, display);
    });
});

*/


//models.user.list(display);
models.attendee.list(display);

/*models.events.get(1, function(err, event){
    if (err) { die (err); }
    event.badge = badge;
    models.events.update(1, event, function(err){
        if (err) { die(err); }
        models.events.get(1, display);
    });
});*/
function display(err, data){
    if (err){
        console.log(err);
        process.exit(1);
    } else {
        console.log(JSON.stringify(data, null, 2));

    }
}
