const Game = require('../models/game');
const PlayerState = require('../models/player-state');
const ReadPreference = require('mongodb').ReadPreference;

require('../mongo').connect();

async function get() {
    const query = Game.find({}).read(ReadPreference.NEAREST);
    return await query.exec();
}

async function getById(id) {
    const query = Game.findById(id).read(ReadPreference.NEAREST);
    const game = await query.exec();
    await getPlayerStates(game);
    return game;   
}

async function create(gameType, user) { 
    const { displayName, userId } = user
    const game = new Game({ gameType, owner: displayName, ownerId: userId });

    return await game.save();
}

async function remove(id) {
    const query = Game.deleteOne({ _id: id })
    return await query.exec();
}

async function getPlayerStates(game) {
    const query = PlayerState.find({gameId:game._id}).read(ReadPreference.NEAREST);
  
    const states = await query.exec();
    game.playerStates = states;
}

function handleSocketMessage(action, info, onSuccess, onError) {
    switch (action) {
        case 'create':
            create(info.gameType, info.user)
                .then(game => onSuccess({ 
                    info: { game },
                    action: 'create',
			        type: 'game'}))
                .catch(err => onError(err))
            break;
        case 'delete':
            remove(info.id)
                .then(() => onSuccess({ 
                    info,
                    action: 'delete',
                    type: 'game'}))
                .catch(err => onError(err))
                break;
        case 'join':
            join(info.id, info.user)
                .then(() => onSuccess({ info,
                    action: 'join',
                    type: 'game'}))
                .catch(err => onError(err))
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