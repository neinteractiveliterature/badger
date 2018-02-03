'use strict';
var async = require('async');
var _ = require('underscore');
var database = require('../lib/database');
var validator = require('validator');

exports.get = function(id, cb){
    var query = 'select * from events where id = $1';
    database.query(query, [id], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.getByName = function(name, cb){
    var query = 'select * from events where name = $1';
    database.query(query, [name], function(err, result){
        if (err) { return cb(err); }
        if (result.rows.length){
            return cb(null, result.rows[0]);
        }
        return cb();
    });
};

exports.list = function(cb){
    var query = 'select * from events order by created desc';
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
    var query = 'insert into events (name, description, badge, margin, importer_id) values ($1, $2, $3, $4, $5) returning id';
    var dataArr = [data.name, data.description, JSON.stringify(data.badge), data.margin, data.importer_id];
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
    var query = 'update events set name = $2, description = $3, badge = $4, margin=$5, importer_id = $6 where id = $1';
    var dataArr = [id, data.name, data.description, JSON.stringify(data.badge), data.margin, data.importer_id];
    database.query(query, dataArr, cb);
};

exports.delete =  function(id, cb){
    var query = 'delete from events where id = $1';
    database.query(query, [id], cb);
};

function validate(data){
    if (! validator.isLength(data.name, 2, 255)){
        return false;
    }
    return true;
}
