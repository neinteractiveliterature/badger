var express = require('express');
var router = express.Router();
var _ = require('underscore');

function logout(req, res, next){
    if (_.has(req.session, 'user')){
        delete req.session.user;
    }
    req.flash('info', 'Logged Out');
    res.redirect('/');
}


// Log out
router.get('/', logout);

module.exports = router;
