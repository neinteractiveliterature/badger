'use strict';
var async = require('async');
var config = require('config');
var models = require('./models');
var _ = require('underscore');


function log(user_id, action, object_type, object_id, data, cb){
    var audit = {
        user_id: user_id,
        action: action || 'unknown',
        object_type: object_type,
        object_id: object_id,
        data: data || null
    };
    models.audit.create(audit, cb);
}

function getAudits(object_type, id, cb){
    async.parallel({
        audits: function(cb){
            models.audit.listByObject(object_type, id, cb);
        },
        users: function(cb){
            models.user.list(cb);
        }
    }, function(err, result){
        if (err) { return cb(err); }
        var users = _.indexBy(result.users, 'id');
        var audits = _.map(result.audits, function(audit){
            //audit.user = _.findWhere(users, {id: audit.user_id}).name
            audit.user = users[audit.user_id].name;
            return audit;
        });
        cb(null, audits);
    });
}

function getAuditsByUser(user_id, cb){
    async.parallel({
        audits: function(cb){
            models.audit.listByUser(user_id, cb);
        },
        user: function(cb){
            models.user.list(cb);
        },
        note: function(cb){
            models.note.list(cb);
        },
        event: function(cb){
            models.event.list(cb);
        },
        attendee: function(cb){
            models.attendee.list(cb);
        },
        importer: function(cb){
            models.importer.list(cb);
        }
    }, function(err, result){
        if (err)  { return cb(err); }
        var data = {};
        for (var type in result){
            data[type] = _.indexBy(result[type], 'id');
        }
        var audits = _.map(result.audits, function(audit){

            var object = data[audit.object_type][audit.object_id];
            if (!object) {
                audit.object = 'Deleted ' + audit.object_type + ' #' + audit.object_id;
                audit.deleted = true;
            } else if (_.has(object, 'name')){
                audit.object = object.name;
            } else {
                audit.object = object.id;
            }
            return audit;
        });
        cb(null, audits);
    });
}

exports.middleware = function(req, res, next){
    req.audit = function(){
        var action = arguments[0];
        var object_type = arguments[1];
        var object_id = arguments[2];
        var cb = function(){};
        var data = null;

        if (typeof arguments[arguments.length-1] === 'function'){
            cb = arguments[arguments.length-1];
        }

        if (arguments.length > 3 && typeof arguments[3] === 'object'){
            data = arguments[3];
        }

        if (req.session.user){
            log(req.session.user.id, action, object_type, object_id, data, cb);
        } else {
            process.nextTick(cb);
        }
    };
    req.getAudits = getAudits;
    req.getAuditsByUser = getAuditsByUser;
    next();
};

exports.log = log;
exports.getAudits = getAudits;
