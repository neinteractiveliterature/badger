'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(id, cb){
    var query = 'select * from audits where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.getActions = function(cb){
    var query = 'select distinct action from audits';
    database.query(query, function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
}


exports.list = function(cb){
    var query = 'select * from audits';
    database.query(query, function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.listByUser = function(user_id, cb){
    var query = 'select * from audits where user_id = $1 order by created desc';
    database.query(query, [user_id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};


exports.listByObject = function(type, id, cb){
    var query = 'select * from audits where object_type = $1 and object_id = $2 order by created desc';
    database.query(query, [type, id], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.listByAction = function(action, id, cb){
    var query = 'select * from audits where action = $1 order by created desc';
    database.query(query, [action], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);

    });
};

exports.listAttendeeAuditsByEvent = function(eventId, cb){
    var query = 'select a.id, a.user_id, a.action, a.object_id, a.data, a.created from audits a left join attendees on a.object_id = attendees.id ';
    query +=    'where a.object_type = \'attendee\' and attendees.event_id = $1 order by a.created';
    database.query(query, [eventId], function(err, result){
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
    var query = 'insert into audits (user_id, action, object_type, object_id, data) values ($1, $2, $3, $4, $5) returning id';
    var dataArr = [data.user_id, data.action, data.object_type, data.object_id, data.data];
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
    var query = 'update audits set user_id = $2, action = $3, object_type = $4, object_id = $5, data = $6where id = $1';
    var dataArr = [id, data.user_id, data.action, data.object_type, data.object_id, data.data];
    database.query(query, dataArr, cb);
};

exports.delete =  function(id, cb){
    var query = 'delete from audits where id = $1';
    database.query(query, [id], cb);
};

function validate(data){
    return true;
}
