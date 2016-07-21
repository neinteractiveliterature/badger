var express = require('express');
var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var async = require('async');
var _ = require('underscore');


function list(req, res, next){
    req.models.pronoun.list(function(err, pronouns){
        if (err) { return cb(err); }
        var list = _.reduce( pronouns, function(o, e){
            o[e.values] = e.values;
            return o;
        }, {});
        if (req.query.id){
            var parts = req.query.id.split('-');
            var id = parts[1];
            req.models.attendee.get(id, function(err, attendee){
                if (err) { return next(err); }
                if (attendee) {
                    if (_.has(attendee.data,  'pronouns') &&  !_.has(list, attendee.data.pronouns)){
                        list[attendee.data.pronouns] = 'Custom: ' + attendee.data.pronouns;
                    }
                }
                res.json(list);

            })
        } else {
            res.json(list);
        }
    });
}

router.use(auth.basicAuth);
router.use(permission('login'));

/* select a new event. */
router.get('/', list);

module.exports = router;
