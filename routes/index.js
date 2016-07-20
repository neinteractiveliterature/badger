var express = require('express');
var router = express.Router();
var permission = require('../lib/permission');

/* GET home page. */
router.get('/', permission('login'), function(req, res, next) {
  res.render('index', { title: 'Badger Home' });
});

module.exports = router;
