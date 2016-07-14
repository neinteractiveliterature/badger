'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(id, cb){
    var query = 'select * from importers where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.getByName = function(id, cb){
    var query = 'select * from importers where name = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.list = function(cb){
    var query = 'select * from importers';
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
    var query = 'insert into importers (name, rules) values ($1, $2) returning id';
    var dataArr = [data.name, data.rules];
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
    var query = 'update importers set name = $2, rules = $3 where id = $1';
    var dataArr = [id, data.name, data.rules];
    database.query(query, dataArr, cb);
};

exports.delete =  function(id, cb){
    var query = 'delete from importers where id = $1';
    database.query(query, [id], cb);
};

function validate(data){

    return true;
}
