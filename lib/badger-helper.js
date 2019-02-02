'use strict';
var async = require('async');
var config = require('config');
var _ = require('underscore');

exports.setCurrentEventId = function ( req, event_id, cb){
    var current_event_id = config.get('app.defaultEventId');
    if (event_id){
        current_event_id = event_id;
    }
    req.models.event.get(current_event_id, function(err, event){
        if (err) { return cb(err); }
        req.models.importer.get(event.importer_id, function(err, importer){
            if (err) { return cb(err); }
            event.importer = importer;
            event.displayFields = [];
            for (var field in importer.rules.attendee){
                if (typeof (importer.rules.attendee) === 'object' && importer.rules.attendee[field].display){
                    event.displayFields.push(field);
                }
            }
            req.session.currentEvent = event;
            if (req.session.user){
                req.models.user.get(req.session.user.id, function(err, user){
                    if (err) { return cb(err); }
                    user.current_event_id = current_event_id;
                    req.models.user.update(user.id, user, cb);
                });
            } else {
                cb();
            }
        });
    });
};


exports.setSection = function(section){
    return function(req, res, next){
        res.locals.siteSection = section;
        next();
    };
};
