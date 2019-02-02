var express = require('express');
var router = express.Router();
var permission = require('../lib/permission');
var auth = require('../lib/auth');
var badgerHelper = require('../lib/badger-helper');
var _ = require('underscore');
var csurf = require('csurf');
var async = require('async');


function list(req, res, next){
    req.models.user.list(function(err, users){
        if (err) {return next(err); }
        res.locals.users = users;
        res.render('users/list');
    });
}

function show(req, res, next){
    var user_id = req.params.id;
    req.models.user.get(user_id, function(err, user){
        if (err) {return next(err); }
        res.locals.user = user;
        req.getAuditsByUser(user_id, function(err, audits){
            if (err) { return next(err); }
            res.locals.audits = audits;
            res.render('users/show');
        });
    });
}

function showNew(req, res, next){
    res.locals.csrfToken = req.csrfToken();
    res.locals.user = {
        name: null,
        username: null,
        password: null,
        admin: false,
        events: {}
    };
    if (_.has(req.session, 'userData')){
        res.locals.user = req.session.userData;
        delete req.session.userData;
    }
    res.render('users/new');
}

function showEdit(req, res, next){
    res.locals.csrfToken = req.csrfToken();
    var user_id = req.params.id;
    if (_.has(req.session, 'userData')){
        res.locals.user = req.session.userData;
        delete req.session.userData;
        res.render('users/edit');
    } else {
        req.models.user.get(user_id, function(err, user){
            if (err) { return next(err); }
            if (!res.locals.checkPermission('admin') && user.admin){
                req.flash('error', 'You are not authorized to edit that user');
                return res.redirect('/users/'+ user_id);
            }

            res.locals.user = user;
            res.render('users/edit');
        });
    }
}

function create(req, res, next){
    var user = req.body.user;

    for (var event in user.events){
        user.events[event.replace(/^event-/, '')] = user.events[event];
        delete user.events[event];
    }

    req.session.userData = user;

    if (!user.password){
        req.flash('error', 'Password is required');
        return res.redirect('/users/new');
    }
    if (!user.name){
        req.flash('error', 'Name is required');
        return res.redirect('/users/new');
    }
    if (!user.username){
        req.flash('error', 'Username is required');
        return res.redirect('/users/new');
    }

    if (user.password !== user.password_confirm){
        req.flash('error', 'Passwords do not match');
        return res.redirect('/users/new');
    }

    var doc = {
        name: user.name,
        username: user.username
    };

    if (res.locals.checkPermission('admin')){
        doc.admin = user.admin === 'on';
        doc.locked = user.locked === 'on';
    }

    auth.hash(user.password, function(err, hash){
        if (err){
            req.flash('error', err);
            return res.redirect('/users/new');
        }
        doc.password = hash;
        req.models.user.create(doc, function(err, userId){
            if (err){
                req.flash('error', err);
                return res.redirect('/users/new');
            }
            updateEvents(req, userId, user.events, function(err){
                if (err){
                    console.log(err);
                    req.flash('error', 'Error saving Event Permisions');
                    return res.redirect('/users/new');
                }

                req.audit('create', 'user', userId);
                req.flash('success', 'created user '+ doc.name);
                delete req.session.userData;
                res.redirect('/users/' + userId);
            });
        });
    });

}

function update(req, res, next){
    var id = req.params.id;
    var user = req.body.user;

    for (var event in user.events){
        user.events[event.replace(/^event-/, '')] = user.events[event];
        delete user.events[event];
    }

    req.session.userData = user;
    if (!user.name){
        req.flash('error', 'Name is required');
        return res.redirect('/users/'+id+'/edit');
    }
    if (!user.username){
        req.flash('error', 'Username is required');
        return res.redirect('/users/'+id+'/edit');
    }

    var doc = {
        name: user.name,
        username: user.username,
    };

    if (res.locals.checkPermission('admin')){
        doc.admin = user.admin === 'on';
        doc.locked = user.locked === 'on';
    }

    if (user.password) {
        if (user.password !== user.password_confirm){
            req.flash('error', 'Passwords do not match');
            return res.redirect('/users/'+id+'/edit');
        }

        auth.hash(user.password, function(err, hash){
            if (err){
                req.flash('error', err);
                return res.redirect('/users/'+id+'/edit');
            }
            doc.password = hash;
            updateUser();
        });
    } else {
        updateUser();
    }

    function updateUser(){
        async.waterfall([
            function(cb){
                req.models.user.get(id, cb);
            },
            function(record, cb){
                for (var key in doc){
                    record[key] = doc[key];
                }
                req.models.user.update(id, record, cb);
            },
            function(result, cb){
                if (! res.locals.checkPermission('admin')){
                    for (event in user.events){
                        if (!req.session.user.events[event].admin){
                            delete user.events[event];
                        }
                    }
                }
                updateEvents(req, id, user.events, cb);
            }
        ], function(err){
            if (err){
                req.flash('error', err);
                return res.redirect('/users/'+id+'/edit');
            }

            req.audit('update', 'user', id);
            req.flash('success', 'Updated user '+ doc.name);
            delete req.session.userData;
            res.redirect('/users/' + id);
        });
    }
}

function updateEvents(req, userId, events, cb){
    async.series([
        function(cb){
            async.each(_.keys(events), function(event, cb){
                req.models.event_user.delete(event, userId, cb);
            }, cb);
        },
        function(cb){
            async.each(_.keys(events), function(event, cb){
                if (! (events[event].access || events[event].admin)){
                    return process.nextTick(cb);
                }
                var doc = {
                    user_id: userId,
                    event_id: event,
                    admin: _.has(events[event], 'admin') && events[event].admin === 'on'
                };
                req.models.event_user.create(doc, cb);
            }, cb);
        }
    ], cb);
}

router.use(auth.basicAuth);
router.use(permission('eventadmin'));

router.use(badgerHelper.setSection('admin'));

router.get('/', list);
router.get('/new', csurf(), showNew);
router.get('/:id', show);
router.get('/:id/edit', csurf(),showEdit);

router.post('/', csurf(), create);
router.put('/:id', csurf(), update);
//router.delete('/:id', delete);

module.exports = router;
