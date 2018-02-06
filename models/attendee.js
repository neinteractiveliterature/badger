'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');
var models = {
    note: require('./note')
};

exports.get = function(id, cb){
    var query = 'select * from attendees where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return getRelated(result.rows[0], cb);
        }
        return cb();
    });
};

exports.getByEmail = function(event_id, email, cb){
    var query = 'select * from attendees where event_id = $1 and email = $2';
    database.query(query, [event_id, email], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return getRelated(result.rows[0], cb);
        }
        return cb();
    });
};

exports.search = function(event_id, text, cb){
    var query = 'select * from attendees where (UPPER(name) like $1 or UPPER(email) like $1) and event_id = $2';
    database.query(query, ['%' + text.toUpperCase() + '%', event_id], function(err, result){
        if (err) { return cb(err); }
        return getRelated(result.rows, cb);
    });
};

exports.list = function(cb){
    var query = 'select * from attendees order by name';
    database.query(query, function(err, result){
        if (err) { return cb(err); }
        return getRelated(result.rows, cb);
    });
};

exports.listByEvent = function(event_id, cb){
    var query = 'select * from attendees where event_id = $1 order by name';
    database.query(query, [event_id], function(err, result){
        if (err) { return cb(err); }
        return getRelated(result.rows, cb);
    });
};

exports.listTypes = function(cb){
    var query = 'select distinct type from attendees';
    database.query(query, function(err, result){
        if (err) { return cb(err); }

        return cb(null, _.pluck(result.rows, 'type'));
    });
};

exports.listTypesByEvent = function(event_id, cb){
    var query = 'select distinct type from attendees where event_id = $1';
    database.query(query, [event_id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, _.pluck(result.rows, 'type'));
    });
};

exports.create = function(data, cb){
    if (! validate(data)){
        return process.nextTick(function(){
            cb('Invalid Data');
        });
    }
    var query = 'insert into attendees (name, email, event_id, registered, type, data) values ($1, $2, $3, $4, $5, $6) returning id';
    var dataArr = [data.name, data.email, data.event_id, data.registered, data.type, data.data];
    database.query(query, dataArr, function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows[0].id);
    });
};

exports.update =  function(id, data, cb){
    if (! validate(data)){
        return process.nextTick(function(){
            cb('Invalid Data');
        });
    }
    var query = 'update attendees set name = $2, email = $3, event_id = $4, data = $5, checked_in = $6, badged = $7, registered = $8, type = $9 where id = $1';
    var dataArr = [id, data.name, data.email, data.event_id, data.data, data.checked_in, data.badged, data.registered, data.type];
    database.query(query, dataArr, cb);
};

exports.delete =  function(id, cb){
    var query = 'delete from attendees where id = $1';
    database.query(query, [id], cb);
};

function validate(data){
    if (! validator.isLength(data.name, 2, 255)){
        return false;
    }
    if (! validator.isEmail(data.email)){
        return false;
    }
    return true;
}

function getRelated(data, cb){
    if (Array.isArray(data)){
        async.map(data, lookupRelated, cb);
    } else {
        lookupRelated(data, cb);
    }
}

function lookupRelated(data, cb){
    async.parallel({
        notes: function(cb){
            models.note.listByAttendee(data.id, cb);
        }
    }, function(err, result){
        if (err) { return cb(err); }
        for (var key in result){
            data[key] = result[key];
        }
        cb(null, data);
    });
}
