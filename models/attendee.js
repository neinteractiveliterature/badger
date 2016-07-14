'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(id, cb){
    var query = 'select * from attendees where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.getByEmail = function(event_id, email, cb){
    var query = 'select * from attendees where event_id = $1 and email = $2';
    database.query(query, [event_id, email], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.search = function(event_id, text, cb){
    var query = 'select * from attendees where name like $1 or email like $1 and event_id = $2';
    database.query(query, ['%' + text + '%', event_id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.list = function(cb){
    var query = 'select * from attendees';
    database.query(query, function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.listByEvent = function(event_id, cb){
    var query = 'select * from attendees where event_id = $1';
    database.query(query, [event_id], function(err, result){
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
    var query = 'insert into attendees (name, email, event_id, data) values ($1, $2, $3, $4) returning id';
    var dataArr = [data.name, data.email, data.event_id, data.data];
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
    var query = 'update attendees set name = $2, email = $3, event_id = $4, data = $5, checked_in = $6, badged = $7 where id = $1';
    var dataArr = [id, data.name, data.email, data.event_id, data.data, data.checked_in, data.badged];

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
