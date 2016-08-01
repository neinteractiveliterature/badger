var express = require('express');
var async = require('async');
var _ = require('underscore');

var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var badgerHelper = require('../lib/badger-helper');

function show(req, res, next){
    var note_id = req.params.id;
    req.models.note.get(note_id, function(err, note){
        if (err){ return cb(next); }
        if (!note){
            if (req.originalUrl.match(/\/api\//)){
                res.status(404).json({});
            } else {
                req.flash('error', 'Note not found');
                res.redirect('/notes');
            }
        }
    });
}

function list(req, res, next){
    req.models.note.listByEvent(req.session.currentEvent.id, function(err, notes){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(result);
        } else {
            res.locals.notes = result.notes;
            req.models.attendee.listByEvent(req.session.currentEvent.id, function(err, attendees){
                if (err) { return next(err);}
                res.locals.attendees = _.indexBy(attendees, 'id');
                res.render('notes/list');
            });
        }
    });
}


function clear(req, res, next){
    var note_id = req.params.id;
    req.models.note.get(note_id, function(err, note){
        if (err){ return cb(next); }
        note.cleared = true;
        req.models.note.update(note_id, note, function(err){
            if (err) { return cb(next); }
            req.audit('clear note', 'attendee', note.attendee_id, {note: note_id});
            req.audit('clear', 'note', note_id);
            if (req.originalUrl.match(/\/api\//)){
                res.json({success:true});
            } else {
                res.redirect('/notes/' + note_id);
            }
        })
    });
}

function create(req, res, next){
    var note = req.body.note;
    req.models.note.create(note, function(err, id){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json({success:true});
        } else {
            res.redirect('/notes/' + id);
        }
    });
}

function update(req, res, next){
    var note_id = req.params.id;
    var note = req.body.note;
    req.models.note.update(note_id, note, function(err){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json({success:true});
        } else {
            res.redirect('/notes');
        }
    });
}


router.use(auth.basicAuth);
router.use(permission('access'));

router.get('/', permission('admin'), list);
router.get('/:id', show);
router.post('/', create);
router.put('/:id', update);
router.put('/:id/clear', clear);

module.exports = router;
