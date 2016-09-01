var express = require('express');
var async = require('async');
var _ = require('underscore');

var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var badgerHelper = require('../lib/badger-helper');
var csurf = require('csurf');
var validator = require('validator');

function list(req, res, next){
    req.models.importer.list(function(err, result){
        if(err){ return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(result);
        } else {
            res.locals.importers = result;
            res.render('importers/list');
        }
    });
}

function show(req, res, next){
    var id = req.params.id;
    req.models.importer.get(id, function(err, importer){
        if (err) { return next(err); }
        if (req.originalUrl.match(/\/api\//)){
            res.json(importer);
        } else {
            res.locals.importer = importer;
            res.render('importers/show');
        }
    });
}

function showNew(req, res, next){
    res.locals.importer = {
        name: null,
        rules: '',
    };

    res.locals.csrfToken = req.csrfToken();
    if (_.has(req.session, 'importerData')){
        res.locals.importer = req.session.importerData;
        delete req.session.importerData;
    }

    res.render('importers/new');
}

function showEdit(req, res, next){
    var importer_id = req.params.id;
    res.locals.csrfToken = req.csrfToken();

    if (_.has(req.session, 'importerData')){
        res.locals.importer = req.session.importerData;
        delete req.session.importerData;
        res.render('importers/edit');
    } else {
        req.models.importer.get(importer_id, function(err, importer){
            if (err) { return next(err); }
            res.locals.importer = importer;
            res.render('importers/edit');
        });
    }
}

function create(req, res, next){
    var importer = req.body.importer;

    req.session.importerData = importer;

    var doc = {
        name: importer.name,
        rules: importer.rules,
    }
    req.models.importer.create(doc, function(err, newImporterId){
        if (err){
            req.flash('error', 'Error creating importer: ' + err);
            return res.redirect('/importers/new');
        }
        delete req.session.importerData;
        req.audit('create', 'importer', newImporterId);
        req.flash('success', 'Created Importer '+ doc.name);
        res.redirect('/importers/' + newImporterId);
    });
}


function update(req, res, next){
    var id = req.params.id;
    var importer = req.body.importer;

    req.session.importerData = importer;

    var doc = {
        id: id,
        name: importer.name,
        rules: importer.rules
    };


    req.models.importer.update(id, doc, function(err){
        if (err){
            req.flash('error', 'Error saving importer: ' + err);
            return res.redirect('/importers/' + id + '/edit');
        }
        delete req.session.importerData;
        req.audit('update', 'importer', id);
        req.flash('success', 'Saved Importer '+ doc.name);
        res.redirect('/importers/' + id);
    });
}

function validateRules(req, res, next){
    var rules = req.query.importer.rules;
    try {
        var data = JSON.parse(rules);
    } catch (e){
        return res.status(400).send('Invalid JSON');
    }
    res.status(200).send('OK');
}

router.use(auth.basicAuth);
router.use(permission('admin'));
router.use(badgerHelper.setSection('admin'));

router.get('/', list);
router.get('/validate', validateRules);

router.get('/new', csurf(), showNew);
router.post('/', csurf(), create);

router.get('/:id', show);
router.get('/:id/edit', csurf(), showEdit);
router.put('/:id', csurf(), update);

//router.delete('/:id', permission('admin'), csurf(), deleteEvent);

module.exports = router;
