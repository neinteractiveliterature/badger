var express = require('express');
var router = express.Router();
var async = require('async');
var csurf = require('csurf');
var _ = require('underscore');
var config = require('config');
var permission = require('../lib/permission');
var auth = require('../lib/auth');
var badgerHelper = require('../lib/badger-helper');


function showLogin(req, res, next){
    if (req.session.user){
        return res.redirect('/');
    }

    res.locals.csrfToken = req.csrfToken();
    res.locals.auth = {username:null};
    if (_.has(req.session, 'logindata')){
        res.locals.auth = req.session.logindata;
        delete req.session.logindata;
    }
    res.render('login');
}

function postLogin(req, res, next){
    auth.login(req.body.auth.username, req.body.auth.password, function(err, user, message){
        if (err) { return next(err); }
        if (!user){
            if (message){
                req.flash('loginerror', message);
            } else {
                req.flash('loginerror', 'Invalid Username or Password');
            }
            req.session.logindata = req.body.auth;
            res.redirect('/login');
        } else {
            // check if curent event is valud for this user
            if (!user.admin && ! _.has(user.events, user.current_event_id)){
                if (_.keys(user.events).length){
                    // change to a valid event
                    user.current_event_id = _.keys(user.events)[0];
                } else {
                    // No valid events
                    req.flash('loginerror', 'User has no valid events');
                    return res.redirect('/login');
                }
            }

            req.session.user = user;
            delete req.session.logindata;

            badgerHelper.setCurrentEventId(req, user.current_event_id, function(err){
                if (err) { return next(err); }
                if (_.has(req.session, 'backto')){
                    var backto = req.session.backto;
                    delete req.session.backto;
                    res.redirect(backto);
                } else {
                    res.redirect('/');
                }
            });
        }
    });
}




// Display Login page
router.get('/', csurf(), showLogin);

router.post('/', csurf(), postLogin);

module.exports = router;
