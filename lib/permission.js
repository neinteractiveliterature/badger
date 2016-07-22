'use strict';
var config = require('config');
var _ = require('underscore');
var async = require('async');
var models = require('./models');

module.exports = function(permission, redirect){
    return function(req, res, next){
        var user = req.session.user;

        var checkPermission = function(permission, event_id){
            if (event_id) {
                permission = {
                    event: event_id,
                    type: permission
                };
            }
            return check(req, user, permission);
        };

        if (!user){
            res.locals.checkPermission = checkPermission;
            if (!permission){ return next(); }
            return fail('not logged in');

        }

        models.event_user.listByUser(user.id, function(err, result){
            if (err) { return next(err); }

            req.event_permissions = result.reduce(function(o, e){
                o[e.event_id] = e.admin;
                return o;
            }, {});

            res.locals.checkPermission = checkPermission;

            if (!permission){ return next(); }

            if (check(req, user, permission)){
               return next();
            }

            return fail('permission fail');

        });

        function fail(reason){
            if (reason === 'not logged in'){
                console.log('here');
                if (req.originalUrl.match(/\/api\//)){
                    res.header('WWW-Authenticate', 'Basic realm="Badger"');
                    res.status(401).send('Authentication required');
                } else {
                    if (!req.session.backto &&
                        ! req.originalUrl.match(/\/login/) &&
                        ! req.originalUrl.match(/^\/$/) ){
                        req.session.backto = req.originalUrl;
                    }
                    res.redirect('/login');
                }
            } else {
                if (redirect){
                    req.flash('You are not allowed to access that resource');
                    res.redirect(redirect);
                } else {
                    res.status('403').send('Forbidden');
                }
            }
        }
    };
}

function check(req, user, permission){
    if (typeof(permission) === 'string'){
        if (permission === 'login'){
            if (user) {
                return true;
            }
        } else if (user && permission === 'admin'){
            if (_.has(user, 'admin') && user.admin){
                return true;
            }
        } else if (user && permission === 'access'){
             if (_.has(user, 'admin') && user.admin){
                return true;
            }
            if (_.has(req.event_permissions, req.session.currentEvent.id)){
                return true
            }
        } else if (user && permission === 'eventadmin'){
            if (_.has(user, 'admin') && user.admin){
                return true;
            }
            if (_.has(req.event_permissions, req.session.currentEvent.id) &&
                req.event_permissions[req.session.currentEvent.id].admin){
                return true
            }

        }
    } else if (typeof(permission) === 'object'){
        if (user && _.has(permission, 'event') && _.has(permission, 'type')){

            if (permission.type === 'access'){
                if (_.has(user, 'admin') && user.admin){
                    return true;
                }
                if (_.has(req.event_permissions, permission.event)){
                    return true
                }
            } else if (permission.type === 'admin'){
                if (_.has(user, 'admin') && user.admin){
                    return true;
                }
                if (_.has(req.event_permissions, permission.event) && req.event_permissions[permission.event].admin){
                    return true
                }
            }
        }

    }
    return false;

}
