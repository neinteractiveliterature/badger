'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(event_id, user_id, cb){
    var query = 'select * from events_users where event_id = $1 and user_id = $2';
    database.query(query, [event_id, user_id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.listByUser = function(user_id, cb){
    var query = 'select * from events_users where user_id = $1';
    database.query(query, [user_id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};


exports.listByEvent = function(event_id, cb){
    var query = 'select * from events_users where event_id = $1';
    database.query(query, [event_id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.list = function(cb){
    var query = 'select * from events_users';
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
    var query = 'insert into events_users (user_id, event_id, admin) values ($1, $2, $3) returning id';
    var dataArr = [data.user_id, data.event_id, data.admin];
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
    var query = 'update events_users set user_id = $2, event_id = $3, admin = $4 where id = $1';
    var dataArr = [id, data.user_id, data.event_id, data.admin ];
    database.query(query, dataArr, cb);
};

exports.delete =  function(event_id, user_id, cb){
    var query = 'delete from events_users where event_id = $1 and user_id = $2';
    database.query(query, [event_id, user_id], cb);
};

function validate(data){

    return true;
}
