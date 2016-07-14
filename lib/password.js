'use strict';
var scrypt = require('scrypt');

exports.hash = function(str, cb){
    var scryptParameters = { N: Math.pow(2, 14), r: 8, p: 1 };

    return scrypt.kdf(str.toString('utf8'), scryptParameters, function(err, result){
        if (err) { return cb(err); }
        cb(null, result.toString('base64'));
    });
};

exports.verify = function(hash, password, cb){
    return scrypt.verifyKdf(new Buffer(hash, 'base64'), password, cb);
};
