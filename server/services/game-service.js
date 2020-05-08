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
            let: { ownerId: "$ownerId" },
            as: "owner",
            pipeline: [
                { $match: { "$expr": { $eq: [ "$_id",  "$$ownerId" ] }}},
                { $project: { key: 0, _id: 0 } }]
        } 
    },
    {
        $unwind: "$owner"
    },
    { 
        $addFields: { owner: { userId: "$ownerId" }, gameId: "$_id" } 
    },  
    { 
        $project: { _id: 0, __v: 0, ownerId: 0} 
    } 
];


require('../mongo').connect();

function getLobbies() {
    var agr = [
        {
            "$match": { started: false }
        },
        ...lookups,
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
                    { $addFields: { userId: "$_id" }},
                    { $project: { key: 0, _id: 0, __v: 0 } }]
            }
        },
        { 
            $project: { playerStates: 0, started: 0, players: { key: 0, __v: 0, _id: 0 }} 
        }
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
        {
            $lookup: {
                from: "users",
                let: { playerStates: "$playerStates" },
                as: "playerStates.player",
                pipeline: [
                    { $match: { "$expr": { $in: [ "$_id",  "$$playerStates.playerId" ] }}},
                    { $addFields: { userId: "$_id" }},
                    { $project: { key: 0, _id: 0, __v: 0 } }]
            }
        }
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
        .then(game => {
            return join (game._id, user);
        });
}

function remove(id) {
    return Game.deleteOne({ _id: id }).exec();
}

function join (gameId, user) {
    return new PlayerState({ gameId, playerId: user.userId })
        .save()
        .then(() => getById(gameId));
}

function leave (gameId, user) {
    return PlayerState.deleteOne({ gameId, playerId: user.userId })
        .exec()
        .then(() => Game.deleteOne({_id: gameId, ownerId: user.userId }))
}

module.exports = {
    getLobbies,
    getById,
    getUserGameStatus,
    getCurrentGame,
    create,
    remove,
    join,
    leave
};