const Game = require('../models/game');
const PlayerState = require('../models/player-state');
const ReadPreference = require('mongodb').ReadPreference;
const lookups = [
    {
        $lookup: {
            from: "playerstates",
            localField: "_id",
            foreignField: "gameId",
            as: "playerStates"
        }
    },
    {
        $lookup: {
            from: "users",
            let: { playerStates: "$playerStates", ownerId: "$owner.userId" },
            as: "players",
            pipeline: [
                { $match: { $expr: { $and: 
                    [{ $in: [ "$_id",  "$$playerStates.playerId" ] },
                    { $ne: [ "$_id", "$$ownerId" ] }]
                }}},
                { $addFields: { userId: "$_id", isOwner: {
                    $cond: [{$eq: ["$_id", "$$ownerId"]}, 1, 0]
                  }, state: "$$playerStates.state" }},
                { $project: { key: 0, _id: 0, __v: 0 } }]
        }
    },
    { 
        $addFields: { gameId: "$_id" } 
    },  
    { 
        $project: { _id: 0, __v: 0, playerStates: 0, players: { key: 0, __v: 0, _id: 0 }} 
    }
];


require('../mongo').connect();

function getLobbies() {
    var agr = [
        {
            "$match": { started: false }
        },
        ...lookups,
       
    ];

    return Game.aggregate(agr)
        .read(ReadPreference.NEAREST)
        .exec();
}

function getById(id) {
    var agr = [
        {
            "$match": { _id: id }
        },
        ...lookups,
    ];

    return Game.aggregate(agr)
        .read(ReadPreference.NEAREST)
        .exec()
        .then(games => games.length > 0 ? games[0] : null);
}

function getUserGameStatus (userId) {
    return PlayerState
        .findOne({playerId: userId})
        .then(ps =>  ps ? Game.findById(ps.gameId, { started: 1}) : null);
}

function getCurrentGame (userId) {
    return PlayerState
        .findOne({playerId: userId})
        .then(ps => ps ? getById(ps.gameId) : null);
}

function create(type, title, user) { 
    const { userId } = user

    return new Game({ type, title, ownerId: userId })
        .save()
        .then(game => 
            join (game._id, user).then(() => getById(game._id)));
}

function remove(id) {
    return Game.deleteOne({ _id: id }).exec();
}

function join (gameId, user) {
    return new PlayerState({ gameId, playerId: user.userId })
        .save();
}

function leave (gameId, user) {
    return PlayerState.deleteOne({ gameId, playerId: user.userId })
        .exec()
        .then(() => Game.deleteOne({_id: gameId, ownerId: user.userId }))
}

function start (gameId) {
    return Game.findById(gameId)
    .then(game => {
        game.started = true;
        return game.save();
    })
}

module.exports = {
    getLobbies,
    getById,
    getUserGameStatus,
    getCurrentGame,
    create,
    remove,
    join,
    leave,
    start
};