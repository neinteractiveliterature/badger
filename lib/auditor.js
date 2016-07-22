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
            audit.user = _.findWhere(users, {id: audit.user_id}).name
            return audit;
        });
        cb(null, audits);
    });
}

exports.middleware = function(req, res, next){
    req.audit = function(action, object_type, object_id, data){
        if (req.session.user){
            log(req.session.user.id, action, object_type, object_id, data, function(){});
        }
    };
    req.getAudits = getAudits;
    next();
};

exports.log = log;
exports.getAudits = getAudits;
