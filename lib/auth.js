'use strict';
var async = require('async');
var scrypt = require('scrypt');
var config = require('config');
var models = require('./models');

function hash(str, cb){
    var scryptParameters = scrypt.paramsSync(0.1);
    return scrypt.kdf(str.toString('utf8'), scryptParameters, function(err, result){
        if (err) { return cb(err); }
        cb(null, result.toString('base64'));
    });
}

function verify(hash, password, cb){
    return scrypt.verifyKdf(new Buffer(hash, 'base64'), password, cb);
}

exports.login = function(username, password, cb){
    if (!username || !password){
        return process.nextTick(function(){
            cb(null, false);
        });
    }
    models.user.getByUsername(username, function(err, user){
        if (err) { return cb(err); }
        if (!user) { return cb(null, false); }
        verify(user.password, password, function(err, result){
            if (err) { return cb(err); }
            if (result){
                return cb(null, user);
            } else {
                return cb(null, false);
            }
        });
    });
};

exports.setCurrentEventId = function ( req, event_id, cb){
    var current_event_id = config.get('app.defaultEventId');
    if (event_id){
        current_event_id = event_id;
    }
    req.models.event.get(current_event_id, function(err, event){
        if (err) { return cb(err); }
        req.models.importer.get(event.importer_id, function(err, importer){
            if (err) { return cb(err); }
            event.importer = importer;
            event.displayFields = [];
            for (var field in importer.rules.attendee){
                if (typeof (importer.rules.attendee) === 'object' && importer.rules.attendee[field].display){
                    event.displayFields.push(field);
                }
            }
            req.session.currentEvent = event;
            if (req.session.user){
                req.models.user.get(req.session.user.id, function(err, user){
                    if (err) { return cb(err); }
                    user.current_event_id = current_event_id;
                    req.models.user.update(user.id, user, cb);
                });
            } else {
                cb();
            }
        });
    });
}

exports.basicAuth = function(req, res, next){
    if (req.session && req.session.user){ // already logged in
        return next();
    }
    if (! req.originalUrl.match(/\/api\//)){  // Only run on Api routes
        return next();
    }
    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
        var authHeader=req.headers.authorization || '';
        var parts = new Buffer(authHeader.split(/\s+/).pop(), 'base64').toString().split(/:/);
        var username = parts[0];
        var password = parts[1];

        if (!username || !password){
            return sendAuthHeader(res);
        }

        exports.login(username, password, function(err, user){
            if (err) { return cb(err); }
            if (!user){
                return sendAuthHeader();
            }
            req.session.user = user;
            exports.setCurrentEventId(req, user.current_event_id, next);
        });
    } else {
        sendAuthHeader(res);
    }
}

function sendAuthHeader(res){
    res.header('WWW-Authenticate', 'Basic realm="' + config.get('app.name') + '"');
    res.status(401).send('Authentication required');
}


exports.verify = verify;
exports.hash = hash;
