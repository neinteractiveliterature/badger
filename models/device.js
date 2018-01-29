'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(id, cb){
    var query = 'select * from devices where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.getByName = function(name, cb){
  var query = 'select * from devices where name = $1';
    database.query(query, [name], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.list = function(cb){
    var query = 'select * from devices';
    database.query(query, function(err, result){
        if (err) { return cb(err); }
        return cb(null, result.rows);
    });
};

exports.listActive = function(cb){
    var query = 'select * from devices where active = true';
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
    var query = 'insert into devices (name, active, enabled) values ($1, $2, $3) returning id';
    var dataArr = [data.name, data.active, data.enabled];
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
    var query = 'update devices set name = $2, active = $3, enabled = $4 where id = $1';
    var dataArr = [id, data.name, data.active, data.enabled];
    database.query(query, dataArr, cb);
};


exports.delete =  function(id, cb){
    var query = 'delete from devices where id = $1';
    database.query(query, [id], cb);
};

function validate(data){

    return true;
}
