'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(id, cb){
    var query = 'select * from users where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.getByUsername = function(text, cb){
    var query = 'select * from users where username = $1';
    database.query(query, [text], function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.list = function(cb){
    var query = 'select * from users';
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
    var query = 'insert into users (name, username, password, admin) values ($1, $2, $3, $4) returning id';
    var dataArr = [data.name, data.username, data.password, data.admin];
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
    var query = 'update users set name = $2, username = $3, password = $4, admin = $5 where id = $1';
    var dataArr = [id, data.name, data.username, data.password, data.admin ];
    database.query(query, dataArr, cb);
};

exports.delete =  function(id, cb){
    var query = 'delete from users where id = $1';
    database.query(query, [id], cb);
};

function validate(data){
    if (! validator.isLength(data.name, 2, 255)){
        return false;
    }
    if (! validator.isLength(data.username, 3, 20)){
        return false;
    }
    if (! validator.isBoolean(data.admin)){
        return false;
    }
    return true;
}
