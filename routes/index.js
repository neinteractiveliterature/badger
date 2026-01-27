var express = require('express');
var router = express.Router();
var permission = require('../lib/permission');

/* GET home page. */
router.get('/', permission('login'), function(req, res, next) {
    req.models.attendee.listByEvent(req.session.currentEvent.id, function(err, attendees){
        if (err) { return cb(err); }
        res.locals.attendeeData = {
            registered: attendees.filter(function(e) { return e.registered; }).length,
            checkedIn: attendees.filter(function(e) { return e.checked_in; }).length
        };
        res.locals.siteSection='search';

        res.render('index', { title: 'Badger Home' });
    });
});

module.exports = router;
