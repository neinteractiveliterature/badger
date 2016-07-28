var express = require('express');
var async = require('async');
var _ = require('underscore');

var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var badgerHelper = require('../lib/badger-helper');
var csurf = require('csurf');

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
            req.models.importer.get(event.importer_id, function(err, importer){
                if (err) { return next(err); }
                event.importer = importer;
                res.locals.event = event;
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
        res.render('events/edit');
    });
}


router.use(auth.basicAuth);
router.use(permission('login'));
router.use(badgerHelper.setSection('admin'));

/* select a new event. */
router.get('/', permission('admin'), list);

router.get('/new', permission('admin'), csurf(), showNew);
//router.post('/', permission('admin'), csurf(), create);

router.get('/:id', permission('admin'), show);
router.get('/:id/select', selectEvent);
router.get('/:id/edit', permission('admin'), csurf(), showEdit);
//router.put('/:id', permission('admin'), csurf(), update);

//router.delete('/:id', permission('admin'), csurf(), deleteEvent);

module.exports = router;
