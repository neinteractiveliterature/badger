var express = require('express');
var async = require('async');
var _ = require('underscore');
var csurf = require('csurf');

var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var badgerHelper = require('../lib/badger-helper');

function show(req, res, next){
    var note_id = req.params.id;
    req.models.note.get(note_id, function(err, note){
        if (err){ return next(err); }
        if (!note){
            if (req.originalUrl.match(/\/api\//)){
                res.status(404).json({});
            } else {
                req.flash('error', 'Note not found');
                res.redirect('/notes');
            }
        }
        if (req.originalUrl.match(/\/api\//)){
            res.json(note);
        } else {
            req.models.attendee.get(note.attendee_id, function(err, attendee){
                if (err) { return next(err); }
                res.locals.note = note;
                res.locals.attendee = attendee;
                res.render('notes/show');
            });
        }
    });
}

function list(req, res, next){
    req.models.note.listByEvent(req.session.currentEvent.id, function(err, notes){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(notes);
        } else {
            res.locals.notes = notes;
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
        if (err){ return next(err); }
        note.cleared = true;
        req.models.note.update(note_id, note, function(err){
            if (err) { return next(err); }
            req.audit('clear note', 'attendee', note.attendee_id, {note: note_id});
            req.audit('clear', 'note', note_id);
            if (req.originalUrl.match(/\/api\//)){
                res.json({success:true});
            } else {
                res.redirect('/notes/' + note_id);
            }
        });
    });
}

function create(req, res, next){
    var note = req.body.note;
    note.cleared = false;
    req.models.note.create(note, function(err, id){
        if (err) { return next(err); }
        req.audit('create note', 'attendee', note.attendee_id, {note: id});
        req.audit('create', 'note', id);

        if (req.originalUrl.match(/\/api\//)){
            res.json({success:true});
        } else {
            if (req.body.backto && req.body.backto === 'attendee'){
                res.redirect('/attendees/' + note.attendee_id);
            } else {
                res.redirect('/notes/' + id);
            }
        }
    });
}

function update(req, res, next){
    var note_id = req.params.id;
    var note = req.body.note;
    req.models.note.update(note_id, note, function(err){
        if (err) { return next(err); }
        req.audit('update note', 'attendee', note.attendee_id, {note: note_id});
        req.audit('update', 'note', note_id);
        if (req.originalUrl.match(/\/api\//)){
            res.json({success:true});
        } else {
            res.redirect('/notes/' + note.id);
        }
    });
}

function showNew(req, res, next){
    res.locals.note = {
        attendee_id: null,
        contents: null,
    };
    if (_.has(req.session, 'noteData')){
        res.locals.note = req.session.noteData;
        delete req.session.noteData;
    }
    req.models.attendee.listByEvent(req.session.currentEvent.id, function(err, attendees){
        if (err) { return next(err);}
        res.locals.attendees = _.indexBy(attendees, 'id');
        res.render('notes/new');
    });
}

function showEdit(req, res, next){
    var note_id = req.params.id;
    if (_.has(req.session, 'noteData')){
        res.locals.note = req.session.noteData;
        delete req.session.noteData;
    } else {
        req.models.note.get(note_id, function(err, note){
            if (err) { return next(err); }
            res.locals.note = note;
        });
    }
    req.models.attendee.listByEvent(req.session.currentEvent.id, function(err, attendees){
        if (err) { return next(err);}
        res.locals.attendees = _.indexBy(attendees, 'id');
        res.render('notes/edit');
    });

}

function updateNote(req, res, next){
    var value = req.body.value;
    var parts = req.body.id.split('-');
    var id = parts[1];
    var note = {
        contents: value
    };
    req.models.note.get(id, function(err, note){
        if (err) { return next(err); }
        if (note.cleared){
            return res.status(200).send(note.contents.toString());
        }
        note.contents = value;
        req.models.note.update(id, note, function(err){
            if (err) { return next(err); }
            req.audit('update note', 'attendee', note.attendee_id, {note: id});
            req.audit('update', 'note', id);
            res.status(200).send(value.toString());
        });
    });
}

router.use(auth.basicAuth);
router.use(permission('access'));

router.get('/',         permission('admin'), list);
router.get('/new',      showNew);
router.get('/:id', show);
router.get('/:id/edit', showEdit);
router.post('/',        create);
router.put('/:id',      update);
router.put('/:id/clear', clear);
router.post('/update',  updateNote);

module.exports = router;
