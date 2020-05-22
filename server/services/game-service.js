const Game = require('../models/game');
const PlayerState = require('../models/player-state');
const ReadPreference = require('mongodb').ReadPreference;
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
require('../mongo').connect();

class GameService {
    constructor(user) {
        this.user = user;
        this.currentGameAggregation = [
            { 
                $match: {
                    playerId: this.user.userId
                }
            },
            {
                $lookup: {
                    from: "games",
                    localField: "gameId",
                    foreignField: "_id",
                    as: "game"
                }
            },
            {
                $unwind: "$game"
            },
            { 
                $replaceRoot: { newRoot: "$game" } 
            }
        ];
        this.gameDetailAggregation = [
            {
                $lookup: {
                    from: "playerstates",
                    let: { gameId: "$_id", ownerId: "$ownerId" },
                    as: "players",
                    pipeline: 
                    [
                        { 
                            $match: { 
                                $expr: { 
                                    $eq: [ "$gameId",  "$$gameId" ] 
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: "$playerId" },
                                as: "player",
                                pipeline: 
                                [
                                    { 
                                        $match: { 
                                            $expr: { 
                                                $eq: [ "$_id",  "$$userId" ] 
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: "$player"
                        },
                        { 
                            $project: { 
                                _id: 0,
                                userId: "$player._id", 
                                displayName: "$player.displayName",
                                state: {
                                    public: "$public",
                                    private: "$private"
                                }
                            }
                        },
                    ]
                }
            },            
            { 
                $addFields: { gameId: "$_id" } 
            },  
            { 
                $project: { _id: 0, __v: 0 } 
            }
        ];

        this.stateMaskAggregation = [
            {
                $project: {
                    state: {
                        internal: 0
                    }
                }
            },
            {
                $addFields: {
                    players: {
                        $map: {
                            input: "$players",
                            as: "player",
                            in: {
                                userId: "$$player.userId",
                                displayName: "$$player.displayName",
                                x: "$$player.state",
                                state: {
                                    $cond: [
                                        {$eq: ["$$player.userId", this.user.userId]}, 
                                        {
                                            $mergeObjects: ["$$player.state.public", "$$player.state.private"]
                                        }, 
                                        "$$player.state.public"
                                    ]
                                }
                            }
                        }
                    }
                }
              
            }
        ];
    }

    getLobbies(onSuccess) {
        var agr = [
            {
                "$match": { started: false }
            },
            ...this.gameDetailAggregation,
        ];

        return Game.aggregate(agr)
            .read(ReadPreference.NEAREST)
            .exec()
            .then(onSuccess);
    }

    getById(id, maskState, onSuccess) {
        if (typeof id === 'string') {
            id = ObjectId(id);
        }
        var agr = [
            {
                "$match": { _id: id }
            },
            ...this.gameDetailAggregation,
            ...(maskState ? this.stateMaskAggregation: [])
        ];

        Game.aggregate(agr)
            .read(ReadPreference.NEAREST)
            .exec()
            .then(games => onSuccess(games && games.length > 0 ? games[0] : null));
    }

    getCurrentGame (onSuccess) {
        return PlayerState.aggregate([
            ...this.currentGameAggregation,
            ...this.gameDetailAggregation,
            ...this.stateMaskAggregation
        ])
        .read(ReadPreference.NEAREST)
        .exec()
        .then(games => 
            games.length > 0 ? games[0] : null)
        .then(onSuccess);
    }

    create(type, title, onSuccess) { 
        new Game({ type, title, ownerId: this.user.userId })
        .save()
        .then(doc => 
            this.join(doc._id, onSuccess)
        );
    }

    join(gameId, onSuccess) {
        this.getById(gameId, true, game => {
            if (!game.started && !game.players.some(p => p.userId.equals(this.user.userId))) {
                new PlayerState({ gameId, playerId: this.user.userId })
                .save()
                .then(() => {
                    game.players.push(this.user);
                    onSuccess(game);
                });
            }
        });
    }

    leave(gameId, onSuccess) {
        PlayerState.deleteOne({ gameId, playerId: this.user.userId }, () => {
            this.getById(gameId, false, game => {
                if (game.players.length > 0) {
                    if (game.ownerId.equals(this.user.userId)) {
                        var newOwnerId = game.players[0].userId;
                        Game.updateOne(
                            {_id: gameId},
                            { ownerId: newOwnerId },
                            () =>  onSuccess(newOwnerId)
                        );
                    }
                    onSuccess(null);
                }
                else {
                    Game.deleteOne({_id: gameId })
                    .then(() => onSuccess(null));
                }
            });
        });
    }

    start(gameId, onSuccess) {
        Game.findById(gameId)
        .then(game => {
            game.started = true;

            switch (game.type) {
                case 'skull': 
                    const cards = [{ skull: false }, { skull: false }, { skull: false }, { skull: true }]
                    game.state = { currentTurnPlayer: 0, playingPhase: true };
                    return game.save()
                        .then(() => PlayerState.find({gameId}).exec())
                        .then(playerStates => {
                            for (let i = playerStates.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [playerStates[i], playerStates[j]] = [playerStates[j], playerStates[i]];
                            }
                            return Promise.all(playerStates.map((ps, index) => {
                                ps.public = { score: 0, cards: [{},{},{},{}], playedCards: [], currentBet: 0, passed: false, turnOrder: index };
                                ps.private = { cards, playedCards: [] };
                                return ps.save();
                            }));
                        });
                default:
                    break;
            }
        })
        .then(() => this.getById(gameId, true, onSuccess));
    }

    validateAction(gameId, type, data, onSuccess) {
        this.getById(gameId, false, game => {
            var currentPlayer = game.players.find(p => p.userId.equals(this.user.userId));
            var playerPublic = currentPlayer.state.public;
            var playerPrivate = currentPlayer.state.private;
            var gamePublic = game.state.public;
            if (!currentPlayer) {
                return;
            }
            switch (game.type) {
                case "skull":
                    if (playerPublic.turnOrder !== gamePublic.currentTurnPlayer) {
                        return;
                    }
                    switch (type) {
                        case "cardPlayed":
                            if (!gamePublic.playingPhase) {
                                return 
                            }

                            var cardIndex = data;
                            var card = playerPrivate.cards[cardIndex];

                            if (!card) {
                                return;
                            }

                            playerPrivate.cards.splice(cardIndex, 1);
                            playerPrivate.playedCards.push(card);

                            playerPublic.cards.splice(cardIndex, 1);
                            playerPublic.playedCards.push({});

                            gamePublic.currentTurnPlayer++;
                            gamePublic.currentTurnPlayer %= game.players.length;

                            PlayerState.update({playerId: this.user.userId, gameId },
                                {
                                    playerPrivate,
                                    playerPublic 
                                },
                                () => 
                                Game.update({_id: gameId},
                                    {state: game.state },
                                    () => onSuccess(game)))

                            break;
                        default:
                            break;
                    }
                    break;
            
                default:
                    break;
            }
           

        })
    }

    maskForUser(game, userId) {
        delete game.state.internal;

        game.players.forEach(player => {
            if (!player.userId.equals(userId)) {
                delete player.state.private;
            }
            else {
                player.state = {
                    ...player.state.public,
                    ...player.state.private
                }
            }
        });
    }
}

module.exports = {
    GameService
}