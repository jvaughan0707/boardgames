var gameService = require('../services/game-service');

function get(req, res) {
    gameService.get()
        .then(games => { 
            res.json(games); 
        })
        .catch(err => { 
            res.status(500).send(err); 
        })
}

function getById(req, res) {
    const id = req.params.id;
    gameService.getById(id)
        .then(game => {
            res.json(game); 
        }).catch(err => { 
            res.status(500).send(err); 
        });   
}

function create(req, res) {
    const { gameType } = req.body;
    const user = req.cookies
    gameService.create(gameType, user)
        .then(game => {
            res.json(game);
        }).catch(err => {
            res.status(500).send(err)
        });
}

function handleSocketMessage(type, info, callback) {
    switch (type) {
        case 'create':
            gameService.create(info.gameType, info.user)
                then(game => callback(game))
            break;
    
        default:
            break;
    }
}

module.exports = {
    get,
    getById,
    create,
    handleSocketMessage
};