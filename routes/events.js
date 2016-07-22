var express = require('express');
var async = require('async');
var _ = require('underscore');

var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var badgerHelper = require('../lib/badger-helper');

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


router.use(auth.basicAuth);
router.use(permission('login'));
router.use(badgerHelper.setSection('admin'));

/* select a new event. */
router.get('/', permission('admin'), list);
router.get('/:id/select', selectEvent);


module.exports = router;
