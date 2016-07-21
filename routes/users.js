var express = require('express');
var router = express.Router();
var permission = require('../lib/permission');
var auth = require('../lib/auth');
var _ = require('underscore');


function list(req, res, next){
    req.models.user.list(function(err, users){
        if (err) {return next(err); }
        res.locals.users = users;
        res.render('users/list');
    });
};

function show(req, res, next){
    req.models.user.get(req.params.id, function(err, user){
        if (err) {return next(err); }
        res.locals.user = user;
        res.render('users/show');
    });
};



router.use(auth.basicAuth);
router.use(permission('admin'));

router.use(auth.setSection('admin'));

router.get('/', list);
//router.get('/new', create);
router.get('/:id', show);
//router.get('/:id/edit', edit);

//router.post('/', createPost);
//router.put('/:id', updatePut);
//router.delete('/:id', delete);

module.exports = router;
