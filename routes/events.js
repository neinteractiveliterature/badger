var express = require('express');
var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var auth = require('../lib/auth');
var _ = require('underscore');

function selectEvent(req, res, next){
    var event_id = req.params.id;
    auth.setCurrentEventId(req, event_id, function(err){
        if (err) { return next(err); }
        res.redirect('/');
    });
}


router.use(auth.basicAuth);
router.use(permission('login'));
/* select a new event. */
router.get('/:id/select', selectEvent);

module.exports = router;
