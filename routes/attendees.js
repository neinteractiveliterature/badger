var express = require('express');
var router = express.Router();
var permission = require('../lib/permission');
var auth = require('../lib/auth');
var _ = require('underscore');
var badge = require('../lib/badge');

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
    req.models.attendee.get(req.params.id, function(err, attendee){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(attendee);
        } else {
            res.locals.attendee = attendee;
            res.render('attendees/show');
        }
    });
}

function printBadge(req, res, next){
    req.models.attendee.get(req.params.id, function(err, attendee){
        if (err) { return next(err); }
        badge.print(req.session.currentEvent.badge, attendee, function(err){
            if (err){ return next(err); }
            attendee.badged = true;
            req.models.attendee(attendee.id, attendee, function(err){
                if (err){ return next(err); }
                res.json({success:true});
            });
        });
    });
}

function showBadge(req, res, next){
    var event_id = req.session.currentEvent.id;
    var attendee_id = req.params.id;
    req.models.attendee.get(attendee_id, function(err, attendee){
        if (err) { return next(err); }
        badge.print(req.session.currentEvent.badge, attendee, {display:true}, function(err, badge){
            if (err){ return next(err); }
            //res.attachment(attendee.name + '.pdf');
            res.set('Content-Type', 'application/pdf');
            res.send(badge);
        });
    });
}

function checkIn(req, res, next){
    req.models.attendee.get(req.params.id, function(err, attendee){
        if (err) { return next(err); }
        attendee.checked_in = true;
        req.models.attendee(attendee.id, attendee, function(err){
            if (err){ return next(err); }
            res.json({success:true});
        });
    });
}

router.use(auth.basicAuth);
router.use(permission('access'));

router.get('/search', search);
router.get('/', list);
router.get('/listRegistered', listRegistered);

router.get('/:id', get);
router.get('/:id/badge', printBadge);
router.get('/:id/showBadge', showBadge);
router.get('/:id/checkin', checkIn);

module.exports = router;
