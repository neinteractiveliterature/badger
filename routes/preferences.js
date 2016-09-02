var express = require('express');
var router = express.Router();
var permission = require('../lib/permission');
var auth = require('../lib/auth');
var badgerHelper = require('../lib/badger-helper');
var _ = require('underscore');
var csurf = require('csurf');
var async = require('async');

function show(req, res, next){
    res.locals.csrfToken = req.csrfToken();
    var user_id = req.session.user.id
    if (_.has(req.session, 'userData')){
        res.locals.user = req.session.userData;
        delete req.session.userData;
        res.render('users/preferences');
    } else {
        req.models.user.get(user_id, function(err, user){
            if (err) { return next(err); }
            res.locals.user = user;
            res.render('users/preferences');
        });
    }
}

function update(req, res, next){
    var id = req.session.user.id;
    var user = req.body.user;

    req.session.userData = user;

    if (!user.name){
        req.flash('error', 'Name is required');
        return res.redirect('/preferences');
    }

    req.models.user.get(id, function(err, userDoc){
        if (err) {
            req.flash('error', err);
            return res.redirect('/preferences');
        }

        userDoc.name = user.name;

        if (user.password) {
            if (user.password !== user.password_confirm){
                req.flash('error', 'Passwords do not match');
                return res.redirect('/preferences');
            }

            auth.hash(user.password, function(err, hash){
                if (err){
                    req.flash('error', err);
                    return res.redirect('/preferences');
                }
                userDoc.password = hash;
                updateUser(userDoc);
            });
        } else {
            updateUser(userDoc);
        }
    });

    function updateUser(doc ){
         req.models.user.update(id, doc, function(err){
            if (err){
                req.flash('error', err);
                return res.redirect('/preferences');
            }

            req.session.user.name = doc.name;

            req.audit('update', 'user', id);
            req.flash('success', 'Saved user preferences');
            delete req.session.userData;
            res.redirect('/');
        });
    }
}

router.use(badgerHelper.setSection('preferences'));


router.use(auth.basicAuth);
router.use(permission('login'));

router.get('/', csurf(), show);
router.put('/', csurf(), update);

module.exports = router;
