var express = require('express');
var router = express.Router();
var permission = require('../lib/permission');
var auth = require('../lib/auth');
var _ = require('underscore');
var badge = require('../lib/badge');
var badgerHelper = require('../lib/badger-helper');
var async = require('async');
var csurf = require('csurf');

function search(req, res, next){
    var query = req.query.query;
    if (! query ){
        return res.json([]);
    }
    req.models.attendee.search(req.session.currentEvent.id, query, function(err, attendees){
        if (err) { return next(err); }
        res.json(attendees);
    });
}

function list(req, res, next){
    req.models.attendee.listByEvent(req.session.currentEvent.id, function(err, attendees){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(attendees);
        } else {
            res.locals.attendees = attendees;
            res.render('attendees/list');
        }
    });
}

function listRegistered(req, res, next){
    req.models.attendee.listByEvent(req.session.currentEvent.id, function(err, attendees){
        if (err) { return next(err); }
        attendees = _.filter(attendees, function(attendee){
            return  (attendee.registered);
        })
        res.json(attendees)
    });
}

function get(req, res, next){
    var attendee_id = req.params.id;
    if (req.query.from && req.query.from === 'search'){
        res.locals.from = 'search';
        res.locals.siteSection = 'search';
    } else {
        res.locals.from = 'attendees';
    }
    req.models.attendee.get(attendee_id, function(err, attendee){
        if (err) { return next(err); }

        if (req.originalUrl.match(/\/api\//)){
            if (attendee){
                res.json(attendee);
            } else {
                res.status(404).json({});
            }
        } else {
            if (attendee){
                res.locals.attendee = attendee;
                req.getAudits('attendee', attendee_id, function(err, audits){
                    if (err) { return next(err); }
                    res.locals.audits = audits;
                    res.render('attendees/show');
                });
            } else {
                req.flash('error', 'Attendee not found');
                res.redirect('/');
            }
        }
    });
}

function printBadge(req, res, next){
    var attendee_id = req.params.id;
    async.waterfall([
        function(cb){
            async.parallel({
                attendee: function(cb){
                    req.models.attendee.get(attendee_id, cb);
                },
                event: function(cb){
                    req.models.event.get(req.session.currentEvent.id, cb);
                }
            },cb);
        },
        function(data, cb){
            badge.print(data.event.badge, data.event.margin, data.attendee, function(err){
                cb(err, data.attendee);
            });
        },
        function(attendee, cb){
            attendee.badged = true;
            req.models.attendee.update(attendee.id, attendee, cb);
        }
    ], function(err){
        if (err){ return next(err); }
        req.audit('badge', 'attendee', attendee_id);
        res.json({success:true});
    });
}

function showBadge(req, res, next){
    var attendee_id = req.params.id;
    async.parallel({
        attendee: function(cb){
            req.models.attendee.get(attendee_id, cb);
        },
        event: function(cb){
            req.models.event.get(req.session.currentEvent.id, cb);
        }
    }, function(err, data){
        if (err) { return next(err); }
        badge.print(data.event.badge, data.event.margin, data.attendee, {display:true}, function(err, badge){
            if (err){ return next(err); }
            if (req.query.download){
                res.attachment(attendee.name + '.pdf');
            }
            res.set('Content-Type', 'application/pdf');
            res.send(badge);
        });
    });
}

function register(req, res, next){
    var attendee_id = req.params.id;
    req.models.attendee.get(attendee_id, function(err, attendee){
        if (err) { return next(err); }
        if (attendee.registered === true){
            return res.json({success:true});
        }
        attendee.registered = true;
        req.models.attendee.update(attendee.id, attendee, function(err){
            if (err){ return next(err); }
            req.audit('register', 'attendee', attendee_id);
            res.json({success:true});
        });
    });
}

function unregister(req, res, next){
    var attendee_id = req.params.id;
    req.models.attendee.get(attendee_id, function(err, attendee){
        if (err) { return next(err); }
        if (attendee.registered === false){
            return res.json({success:true});
        }
        attendee.registered = false;
        req.models.attendee.update(attendee.id, attendee, function(err){
            if (err){ return next(err); }
            req.audit('unregister', 'attendee', attendee_id);
            res.json({success:true});
        });
    });
}

function checkIn(req, res, next){
    var attendee_id = req.params.id;
    var attendeeData;
    async.waterfall([
        function(cb){
            req.models.attendee.get(attendee_id, cb);
        },
        function(attendee, cb){
            if (attendee_id.checked_in === true){
                if (req.originalUrl.match(/\/api\//)){
                    res.json({success:true});
                } else {
                    req.flash('success', attendeeData.name + ' is already checked in');
                    res.redirect('/attendees/' + attendee_id);
                }
             }
            attendee.checked_in = true;

            attendeeData = attendee;
            req.models.attendee.update(attendee_id, attendee, cb);
        },
        function(attendee, cb){
            req.audit('checkin', 'attendee', attendee_id, cb);
        },
        function(log_id, cb){
            if (req.query.badge){
                async.series([
                    function(cb){
                        req.models.event.get(req.session.currentEvent.id, function(err, event){
                            if (err) { return cb(err); }
                            badge.print(event.badge, event.margin, attendeeData, cb);
                        });
                    },
                    function(cb){
                        attendeeData.badged = true;
                        req.models.attendee.update(attendee_id, attendeeData, cb);
                    },
                    function(cb){
                        req.audit('badge', 'attendee', attendee_id, cb);
                    }
                ], cb);
            } else {
                process.nextTick(cb);
            }
        }
    ], function(err){
        if (err) {
            if (req.originalUrl.match(/\/api\//)){
                return next(err);
            }
            req.flash('error', err);
            return res.redirect('/attendees/' + attendee_id);
        }
        if (req.originalUrl.match(/\/api\//)){
            res.json({success:true});
        } else {
            if (req.query.badge){
                req.flash('success', 'Checked in and Badged '+ attendeeData.name);
                res.redirect('/');
            } else {
                req.flash('success', 'Checked in'+ attendeeData.name);
                res.redirect('/attendees/' + attendee_id);
            }
        }
    });
}

function uncheckIn(req, res, next){
    var attendee_id = req.params.id;
    req.models.attendee.get(attendee_id, function(err, attendee){
        if (err) { return next(err); }
        if (attendee.checked_in === false){
            return res.json({success:true});
        }
        attendee.checked_in = false;
        req.models.attendee.update(attendee.id, attendee, function(err){
            if (err){ return next(err); }
            req.audit('uncheckin', 'attendee', attendee_id);
            res.json({success:true});
        });
    });
}

function updateAttendee(req, res, next){
    var value = req.body.value;
    var parts = req.body.id.split('-');
    var id = parts[1];
    var field = parts[2];
    var fieldName = field;
    var datafield;

    if (field === 'data'){
        datafield = parts[3];
        fieldName = 'data.' + datafield;
        if (req.session.currentEvent.importer.rules.attendee[datafield].type === 'admintext' &&
           ! res.locals.checkPermission('eventadmin') ){
            return res.status(403).send('Not Allowed');
        }
    }
    var storeValue = value;
    if (field === 'registered' ||
        field === 'checked_in' ||
        field === 'badged' ||
        (field==='data' && req.session.currentEvent.importer.rules.attendee[datafield].type === 'boolean')){
        if (value === 'Yes'){
            storeValue = true;
        } else if (value === 'No'){
            storeValue = false;
        }
    }

    req.models.attendee.get(id, function(err, attendee){
        if (err) { return next(err); }
        var oldValue = null;
        if (field === 'data'){
            oldValue = attendee.data[datafield];
            if (oldValue === storeValue){
                return res.status(200).send(value.toString());
            }
            attendee.data[datafield] = storeValue;
        } else {
            oldValue = attendee[field];
            if (oldValue === storeValue){
                return res.status(200).send(value.toString());
            }
            attendee[field] = storeValue;
        }
        req.models.attendee.update(id, attendee, function(err){
            if (err) { return next(err); }
            req.audit('update', 'attendee', id, {field: fieldName, old: oldValue, new: storeValue});
            res.status(200).send(value.toString());
        });
    });
}

function showNew(req, res, next){
    if (req.query.from && req.query.from === 'search'){
        res.locals.from = 'search';
        res.locals.siteSection = 'search';
    } else {
        res.locals.from = 'attendees';
    }

    res.locals.csrfToken = req.csrfToken();
    res.locals.attendee = {
        name: null,
        email: null,
        data: {},
        type: null,
    };
    if (_.has(req.session, 'attendeeData')){
        res.locals.attendee = req.session.attendeeData;
        delete req.session.attendeeData;
    }
    async.parallel({
        types: function(cb){
            req.models.attendee.listTypesByEvent(req.session.currentEvent.id, cb);
        },
        pronouns: function(cb){
            req.models.pronoun.list(cb);
        },
    }, function(err, result){
        if (err) { return next(err); }
        res.locals.types = result.types;
        res.locals.pronouns = result.pronouns;
        res.render('attendees/new');
    });
}

function create(req, res, next){
    var attendee = req.body.attendee;
    // todo - validation and move data in to data object
    var doc = {
        name: attendee.name,
        email: attendee.email,
        event_id: req.session.currentEvent.id,
        type: attendee.type === 'Other'? attendee.usertype : attendee.type,
        data: {}
    };

    for ( var fieldName in req.session.currentEvent.importer.rules.attendee ){
        var field = req.session.currentEvent.importer.rules.attendee[fieldName];
        if (field.type === 'email'){
            doc.data[fieldName] = doc.email;
        } else if (field.type === 'type'){
            doc.data[fieldName] = doc.type;
        } else if (field.type === 'name'){
            doc.data[fieldName] = doc.name;
        } else {
            if (attendee.data[fieldName] === 'Other' && _.has(attendee.data, 'user' + fieldName)){
                doc.data[fieldName] = attendee.data['user' + fieldName];
            } else {
                doc.data[fieldName] = attendee.data[fieldName];
            }
        }
    }

    req.models.attendee.getByEmail(doc.event_id, doc.email, function(err, existing){
        if (err) { return next(err); }
        if (existing){
            req.flash('info', 'Attendee already exists');
            return res.redirect('/attendees/' + existing.id);
        }
        req.models.attendee.create(doc, function(err, id){
            if (err){
                req.flash('error', 'Error creating attendee: '+ err)
                req.session.attendeeData = attendee;
                return res.redirect('/attendee/new');
            }
            req.audit('create', 'attendee', id);
            req.flash('success', 'Attendee Created');
            if (req.query.backto){
                res.redirect(req.query.backto);
            } else {
                res.redirect('/attendees/'+id);
            }
        });
    });
}

router.use(auth.basicAuth);
router.use(permission('access'));
router.use(badgerHelper.setSection('attendees'));

router.get('/search', search);
router.get('/', list);
router.get('/listRegistered', listRegistered);

router.get('/new', csurf(), showNew);
router.post('/', csurf(), create);

router.get('/:id', get);
router.get('/:id/showBadge', showBadge);


router.post('/:id/badge', printBadge);
router.post('/:id/checkin', checkIn);
router.post('/:id/uncheckin', permission('eventadmin'), uncheckIn);
router.post('/:id/register', register);
router.post('/:id/unregister', unregister);

router.post('/update', updateAttendee);

module.exports = router;
