'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

var models = {
    event:  require('./event'),
    event_user: require('./event_user'),
};

exports.get = function(id, cb){
    var query = 'select * from users where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return getRelated(result.rows[0], cb);
        }
        return cb();
    });
};

exports.getByUsername = function(text, cb){
    var query = 'select * from users where username = $1';
    database.query(query, [text], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return getRelated(result.rows[0], cb);
        }
        return cb();
    });
};

exports.list = function(cb){
    var query = 'select * from users order by name';
    database.query(query, function(err, result){
        if (err) { return cb(err); }
        return getRelated(result.rows, cb);
    });
};

exports.create = function(data, cb){
    if (! validate(data)){
        return process.nextTick(function(){
            cb('Invalid Data');
        });
    }
    var query = 'insert into users (name, username, password, admin, locked, current_event_id) values ($1, $2, $3, $4, $5, $6) returning id';
    var dataArr = [data.name, data.username, data.password, data.admin, data.locked, data.current_event_id];
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
    var query = 'update users set name = $2, username = $3, password = $4, admin = $5, locked = $6, current_event_id = $7 where id = $1';
    var dataArr = [id, data.name, data.username, data.password, data.admin, data.locked, data.current_event_id];
    database.query(query, dataArr, cb);
};

exports.delete =  function(id, cb){
    var query = 'delete from users where id = $1';
    database.query(query, [id], cb);
};


function getRelated(data, cb){
    if (Array.isArray(data)){
        async.map(data, lookupRelated, cb);
    } else {
        lookupRelated(data, cb);
    }
}

function lookupRelated(data, cb){
    async.parallel({
        events: function(cb){
            models.event_user.listByUser(data.id, function(err, event_users){
                if (err) { return cb(err); }

                async.map(event_users, function(event_user, cb){
                    models.event.get(event_user.event_id, function(err, event){
                        if (err) { return cb(err); }
                        event.admin = event_user.admin;
                        cb(null, event);
                    });
                }, function(err, events){
                    if (err) { return cb(err);}
                    cb( null, events.reduce(function(o, e){
                        o[e.id] = {
                            name: e.name,
                            admin: e.admin
                        };
                        return o;
                    }, {} ));
                });
            });
        }
    }, function(err, result){
        if (err) { return cb(err); }
        for (var key in result){
            data[key] = result[key];
        }
        cb(null, data);
    });
}

function validate(data){
    if (! validator.isLength(data.name, 2, 255)){
        return false;
    }
    if (! validator.isLength(data.username, 3, 100)){
        return false;
    }
    return true;
}
