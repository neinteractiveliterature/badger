var express = require('express');
var async = require('async');
var _ = require('underscore');

var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var badgerHelper = require('../lib/badger-helper');
var csurf = require('csurf');
var validator = require('validator');

function selectEvent(req, res, next){
    var event_id = req.params.id;
    badgerHelper.setCurrentEventId(req, event_id, function(err){
        if (err) { return next(err); }
        res.redirect('/');
    });
}

function list(req, res, next){
    async.parallel({
        events: function(cb){
            req.models.event.list(cb);
        },
        importers: function(cb){
            req.models.importer.list(cb);
        }
    }, function(err, result){
        if(err){ return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(result);
        } else {
            res.locals.events = result.events;
            res.locals.importers = _.indexBy(result.importers, 'id');
            res.render('events/list');
        }
    });
}

function show(req, res, next){
    var event_id = req.params.id;
    req.models.event.get(event_id, function(err, event){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(event);
        } else {
            async.parallel({
                importer: function(cb){
                    req.models.importer.get(event.importer_id, cb);
                },
                attendees: function(cb){
                    req.models.attendee.listByEvent(event_id, cb);
                }
            }, function(err, result){
                if (err) { return next(err); }

                event.importer = result.importer;
                res.locals.event = event;
                res.locals.attendees = {
                    total: result.attendees.length,
                    registered: _.filter(result.attendees, function(e) { return e.registered; }).length,
                    badged: _.filter(result.attendees, function(e) { return e.badged; }).length,
                    checkedIn: _.filter(result.attendees, function(e) { return e.checked_in; }).length
                }
                res.render('events/show');
            });
        }
    });
}

function showNew(req, res, next){
    res.locals.event = {
        name: null,
        importer_id: null,
        badge: null,
        desciption:null
    };

    res.locals.csrfToken = req.csrfToken();
    if (_.has(req.session, 'eventData')){
        res.locals.event = req.session.eventData;
        delete req.session.eventData;
    }
    req.models.importer.list(function(err, importers){
        if(err){ return next(err); }
        res.locals.importers = importers;
        res.render('events/new');
    });
}

function showEdit(req, res, next){
    var event_id = req.params.id;
    async.parallel({
        event: function(cb){
            if (_.has(req.session, 'eventData')){
                var data = req.session.eventData;
                delete req.session.eventData;
                return process.nextTick(function(){
                    cb(null, data);
                });
            }
            req.models.event.get(event_id, cb);
        },
        importers: function(cb){
            req.models.importer.list(cb);
        }
    }, function(err, result){
        if (err){ return next(err); }
        res.locals.event = result.event;
        res.locals.importers = result.importers
        res.locals.csrfToken = req.csrfToken();
        res.render('events/edit');
    });
}

function create(req, res, next){
    var event = req.body.event;

    req.session.eventData = event;

    var doc = {
        name: event.name,
        description: event.description,
        importer_id: event.importer_id,
        badge: []
    }
    buildBadge(event.badge, function(err, badge){
        if (err){
            req.flash('error', err);
            return res.redirect('/events/new');
        }
        doc.badge = badge;

        return res.redirect('/events/new');

        req.models.event.create(doc, function(err, newEventId){
            if (err){
                req.flash('error', 'Error creating event: ' + err);
                return res.redirect('/events/new');
            }
            delete req.session.eventData;
            req.audit('create', 'event', newEventId);
            req.flash('success', 'Created Event '+ doc.name);
            res.redirect('/events/' + newEventId);
        });
    });
}


function update(req, res, next){
    var id = req.params.id;
    var event = req.body.event;

    req.session.eventData = event;

    var doc = {
        id: id,
        name: event.name,
        description: event.description,
        importer_id: event.importer_id,
        badge: []
    }
    buildBadge(event.badge, function(err, badge){
        if (err){
            req.flash('error', err);
            return res.redirect('/events/' + id + '/edit');
        }
        doc.badge = badge;

        return res.redirect('/events/' + id + '/edit');

        req.models.event.update(id, doc, function(err){
            if (err){
                req.flash('error', 'Error saving event: ' + err);
                return res.redirect('/events/' + id + '/edit');
            }
            delete req.session.eventData;
            req.audit('update', 'event', id);
            req.flash('success', 'Saved Event '+ doc.name);
            res.redirect('/events/' + id);
        });
    });
}

function buildBadge(data, cb){
    var badge = [];
    async.mapSeries(data, function(field, cb){
        if (!field.name){
            return process.nextTick(cb);
        }
        if (! (field.x !== '' && field.y !== ''&& field.align !== ''&& field.size !== '')){
            return process.nextTick(function(){
                cb('You must provide X Position, Y Position, Alignment and Size for every field');
            });
        }
        var fieldDoc = {
            name: field.name,
            x: field.x,
            y: field.y,
            align: field.align,
            size: field.size,
        };

        if (field.dataField && field.dataField !== field.name){
            fieldDoc.dataField = field.dataField.match(',')?field.dataField.split(/\s*,\s*/): field.dataField;
        }

        if (field.font){
            fieldDoc.font = field.font;
        }

        if (field.exclusive){
            fieldDoc.exclusive = true;
        }

        if (field.width && field.width !== 'auto'){
            fieldDoc.width = field.width;
        }

        if (field.pdfOptions){
            if (validator.isJSON(field.pdfOptions)){
                try {
                    fieldDoc.pdfOptions = JSON.parse(field.pdfOptions);
                } catch (e) {
                    return cb(e);
                }
            } else {
                return process.nextTick(function(){
                    cb('Invalid JSON for pdfOptions');
                });
            }
        }
        process.nextTick(function(){
            cb(null, fieldDoc);
        });
    }, cb);
}

function deleteEvent(req, res, next){
    var event_id = req.params.id;
    req.models.event.get(event_id, function(err, event){
        if (err){ return next(err); }
        req.models.event.delete(event_id, function(err){
            if (err){ return next(err); }
            if (req.originalUrl.match(/\/api\//)){
                res.json({success:true});
            } else {
                req.flash('success', 'deleted Event '+ event.name);
                res.redirect('/events/');
            }
        });
    });
}

function adminPermission(req, res, next){
    permission({event: req.params.id, type:"admin"})(req, res, next);
}

function accessPermission(req, res, next){
    permission({event: req.params.id, type:"access"})(req, res, next);
}


router.use(auth.basicAuth);
router.use(permission('login'));
router.use(badgerHelper.setSection('admin'));

/* select a new event. */
router.get('/', permission('admin'), list);

router.get('/new', permission('admin'), csurf(), showNew);
router.post('/', permission('admin'), csurf(), create);

router.get('/:id', accessPermission, show);
router.get('/:id/select', selectEvent);
router.get('/:id/edit', adminPermission, csurf(), showEdit);
router.put('/:id', adminPermission, csurf(), update);

//router.delete('/:id', permission('admin'), deleteEvent);

module.exports = router;
