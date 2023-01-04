'use strict';
var async = require('async');
const Scrypt = require('scrypt-kdf');
var config = require('config');

var models = require('./models');
var badgerHelper = require('./badger-helper');

async function hash(str){

    const keyBuf = await Scrypt.kdf(str, { logN: 15 });
    return keyBuf.toString('base64');
}

async function verify(hash, password){
    if (!hash) { return false; }
    if (!password) { return false; }

    const keyBuf = Buffer.from(hash, 'base64');
    return Scrypt.verify(keyBuf, password);
}

exports.login = function(username, password, cb){
    if (!username || !password){
        return process.nextTick(function(){
            cb(null, false);
        });
    }
    models.user.getByUsername(username, async function(err, user){
        if (err) { return cb(err); }
        if (!user) { return cb(null, false); }
        const result = await verify(user.password, password);
        if (result){
            if (user.locked){
                return cb(null, false, 'Account Locked');
            }
            return cb(null, user);
        } else {
            return cb(null, false);
        }
    });
};

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
            if (err) { return next(err); }
            if (!user){
                return sendAuthHeader();
            }
            req.session.user = user;
            badgerHelper.setCurrentEventId(req, user.current_event_id, next);
        });
    } else {
        sendAuthHeader(res);
    }
};

function sendAuthHeader(res){
    res.header('WWW-Authenticate', 'Basic realm="' + config.get('app.name') + '"');
    res.status(401).send('Authentication required');
}


exports.verify = verify;
exports.hash = hash;
