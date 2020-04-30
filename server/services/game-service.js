const Game = require('../models/game');
const PlayerState = require('../models/player-state');
const ReadPreference = require('mongodb').ReadPreference;

require('../mongo').connect();

function get() {
    const query = Game.find({}).read(ReadPreference.NEAREST);
    return query.exec();
}

function getById(id) {
    const query = Game.findById(id).read(ReadPreference.NEAREST);
    return query.exec().then(game => {
        return getPlayerStates(game);
    });
}

function create(gameType, user) { 
    const { displayName, userId } = user
    const game = new Game({ gameType, owner: displayName, ownerId: userId });

    return game.save();
}

function remove(id) {
    const query = Game.deleteOne({ _id: id })
    return query.exec();
}

function getPlayerStates(game) {
    const query = PlayerState.find({gameId:game._id}).read(ReadPreference.NEAREST);
  
    return query.exec()
    .then(states => {
        game.playerStates = states;
        return game;
    });
}

module.exports = {
    get,
    getById,
    create,
    remove
};