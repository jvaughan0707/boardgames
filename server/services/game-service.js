const Game = require('../models/game');
const PlayerState = require('../models/player-state');
const ReadPreference = require('mongodb').ReadPreference;

require('../mongo').connect();

function get() {
    return Game.find({})
        .read(ReadPreference.NEAREST)
        .exec();
}

function getById(id) {
    return Game.findById(id)
        .read(ReadPreference.NEAREST)
        .exec().then(game => {
            return getPlayerStates(game);
        });
}

function getCurrent(userId) {
    return PlayerState.findOne({userId})
        .read(ReadPreference.NEAREST)
        .exec().then(ps => {
            return ps ?
            getById(ps.gameId) :
            null;
        });
}

function create(gameType, title, user) { 
    const { displayName, userId } = user

    return new Game({ gameType, title, owner: displayName, ownerId: userId })
        .save();
}

function remove(id) {
    return Game.deleteOne({ _id: id }).exec();
}

function getPlayerStates(game) {
    return PlayerState.find({gameId:game._id}).read(ReadPreference.NEAREST).exec()
    .then(states => {
        game.playerStates = states;
        return game;
    });
}

module.exports = {
    get,
    getById,
    getCurrent,
    create,
    remove
};