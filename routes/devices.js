var express = require('express');
var async = require('async');
var _ = require('underscore');
var csurf = require('csurf');

var router = express.Router();
var auth = require('../lib/auth');
var permission = require('../lib/permission');
var badgerHelper = require('../lib/badger-helper');

var printerHelper = require('../lib/printer-helper');


function list(req, res, next){
    if (req.originalUrl.match(/\/api\//)){
        res.json(printerHelper.list());
    } else {
        var deviceList = printerHelper.list();
        res.locals.devices = deviceList;
        res.render('devices/list');
    }
}

function clearQueue(req, res, next){
    var printerName = req.params.name;
    printerHelper.cancelJobs(printerName, function(err){
        if (err) { return next(err); }
        printerHelper.getJobs(printerName, function(err, jobs){
            if (err) { return next(err); }
            res.json(jobs);
        });
    });
}

router.use(auth.basicAuth);
router.use(permission('access'));

router.get('/', list);
router.put('/:name/clear', clearQueue);

module.exports = router;
