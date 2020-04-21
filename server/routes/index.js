var express = require('express');
var router = express.Router();

var gameController = require('../controllers/game-controller');
var userController = require('../controllers/user-controller');

router.get('/games', function(req, res, next) {
  gameController.get(req, res);
});

router.get('/games/:id', function(req, res, next) {
  gameController.getById(req, res);
});

router.post('/games', function(req, res, next) {
  gameController.create(req, res);
});

router.post('/users', function(req, res, next) {
  userController.create(req, res);
});

router.post('/users/validate', function(req, res, next) {
  userController.validate(req, res);
});

module.exports = router;
