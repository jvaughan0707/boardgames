
var userService = require('../services/user-service');

function create(req, res) {
    const { displayName } = req.body;
    userService.create(displayName).then((user) => {
        res.json(user);
    }).catch(err => {
        res.status(500).send(err.message)
    });
}

function validate(req, res) {
    const user = req.cookies;
    userService.validate(
        user, 
        (err) => {res.status(500).send(err.message)},  
        (result) =>{ res.json(result) }
    );
}

module.exports = { 
    create,
    validate
}