'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(id, cb){
    var query = 'select * from notes where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.listByAttendee = function(attendee_id, cb){
    var query = 'select * from notes where attendee_id = $1';
    database.query(query, [attendee_id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.listByEvent = function(event_id, cb){
    var query = 'select * from notes where attendee_id in (select id from attendees where event_id = $1)';
    database.query(query, [attendee_id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
}

exports.list = function(cb){
    var query = 'select * from notes';
    database.query(query, function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.create = function(data, cb){
    if (! validate(data)){
        return process.nextTick(function(){
            cb('Invalid Data');
        });
    }
    var query = 'insert into notes (attendee_id, contents, cleared) values ($1, $2, $3) returning id';
    var dataArr = [data.attendee_id, data.contents, data.cleared];
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
    var query = 'update notes set attendee_id = $2, contents = $3, cleared = $4 where id = $1';
    var dataArr = [id, data.attendee_id, data.contents, data.cleared];
    database.query(query, dataArr, cb);
};

exports.delete =  function(id, cb){
    var query = 'delete from notes where id = $1';
    database.query(query, [id], cb);
};

function validate(data){

    return true;
}
