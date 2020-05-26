const Game = require('../models/game');
const PlayerState = require('../models/player-state');
const SkullService = require('./skull-service');
const ReadPreference = require('mongodb').ReadPreference;
const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');

function GameService(user, io, ws) {
  var self = this;
  var currentGameAggregation = [
    {
      $match: {
        playerId: ObjectId(user.userId)
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
  var gameDetailAggregation = [
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
                  $eq: ["$gameId", "$$gameId"]
                }
              }
            },
            { $sort: { order: 1 } },
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
                          $eq: ["$_id", "$$userId"]
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
                userId: { "$toString": "$player._id" },
                displayName: "$player.displayName",
                active: "$active",
                order: "$order",
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
      $addFields: { gameId: { "$toString": "$_id" }, ownerId: { "$toString": "$ownerId" }, }
    },
    {
      $project: { _id: 0, __v: 0 }
    }
  ];

  var stateMaskAggregation = [
    {
      $addFields: {
        state: "$state.public",
        players: {
          $map: {
            input: "$players",
            as: "player",
            in: {
              userId: "$$player.userId",
              displayName: "$$player.displayName",
              active: "$$player.active",
              order: "$$player.order",
              state: {
                $cond: [
                  { $eq: ["$$player.userId", user.userId] },
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

    },
    {
      $project: {
        state: {
          internal: 0,
          public: 0
        }
      }
    }
  ];

  this.getLobbies = function (cb) {
    var agr = [
      {
        "$match": { started: false }
      },
      ...gameDetailAggregation,
    ];

    return Game.aggregate(agr)
      .read(ReadPreference.NEAREST)
      .exec()
      .then(cb);
  }

  var getById = function (id, maskState) {
    if (typeof id === 'string') {
      id = ObjectId(id);
    }
    var agr = [
      {
        "$match": { _id: id }
      },
      ...gameDetailAggregation,
      ...(maskState ? stateMaskAggregation : [])
    ];

    return Game.aggregate(agr)
      .read(ReadPreference.NEAREST)
      .exec()
      .then(games => games && games.length > 0 ? games[0] : null);
  }

  this.getCurrentGame = function (cb) {
    return PlayerState.aggregate([
      ...currentGameAggregation,
      ...gameDetailAggregation,
      ...stateMaskAggregation
    ])
      .read(ReadPreference.NEAREST)
      .exec()
      .then(games => {
        if (games.length > 0) {
          var game = games[0];
          ws.join(game.gameId);
          cb(game);
        }
        else {
          cb(null);
        }
      });
  }

  this.create = function (type) {
    var ownerId = ObjectId(user.userId);
    switch (type) {
      case 'skull':
        var game = SkullService.createGame(ownerId);
        break;
      default:
        return;
    }

    game.save()
      .then(doc => {
        io.emit('lobbyCreated', { gameId: doc._id.toString(), type, title: doc.title, ownerId, players: [] });
        self.join(doc._id);
      });
  }

  this.join = function (gameId) {
    getById(gameId, true)
      .then(game => {
        if (game && !game.started && !game.players.some(p => p.userId == user.userId)) {
          return new PlayerState({ gameId, playerId: ObjectId(user.userId), active: true })
            .save()
            .then(() => {
              game.players.push(user);
              ws.join(game.gameId);
              io.emit('lobbyPlayerJoined', user, gameId);
              io.to(user.userId).emit('gameStatusChanged', game);
            });
        }
      });
  }

  this.leave = function (gameId) {
    ws.leave(gameId);
    io.to(user.userId).emit('gameStatusChanged', null)
    PlayerState.deleteOne({ gameId, playerId: user.userId }, () => {
      getById(gameId, false)
        .then(game => {
          if (game) {
            if (game.players.length > 0) {
              if (game.ownerId == user.userId) {
                game.ownerId = game.players[0].userId;
                Game.updateOne(
                  { _id: gameId },
                  { ownerId: game.ownerId }
                );
              }
              if (game.started) {
                io.to(gameId).emit('playerQuit', user.userId);
              }
              else {
                io.emit('lobbyPlayerLeft', user.userId, gameId, game.ownerId);
              }
            }
            else {
              Game.deleteOne({ _id: gameId })
                .then(() => io.emit('lobbyDeleted', gameId));
            }
          }
        });
    });
  }

  this.start = function (gameId) {
    getById(gameId, false)
      .then(game => {
        if (!game) {
          return;
        }

        game.started = true;

        for (let i = game.players.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [game.players[i], game.players[j]] = [game.players[j], game.players[i]];
        }

        switch (game.type) {
          case 'skull':
            SkullService.initializeGame(game);
            break;
          default:
            break;
        }
        Game.updateOne(
          { _id: gameId },
          {
            state: game.state,
            started: true
          },
          () =>
            game.players.forEach((player, index) => {
              player.order = index;
              PlayerState.updateOne(
                { playerId: player.userId, gameId },
                { private: player.state.private, public: player.state.public, order: index },
                () =>
                  io.to(player.userId).emit('gameStatusChanged', maskForUser(_.cloneDeep(game), player.userId))
              )
            })
        )
      });
  }

  this.validateAction = function (gameId, type, data, onError) {
    getById(gameId, false)
      .then(game => {
        if (!game) {
          return;
        }
        var currentPlayer = game.players.find(p => p.userId == user.userId);

        if (!currentPlayer) {
          onError('You are not in this game');
          return;
        }
        if (!currentPlayer.active) {
          onError('You are not currently ative in this game')
          return;
        }

        var onSuccess = outputData => PlayerState.updateOne(
          { playerId: user.userId, gameId },
          { private: currentPlayer.state.private, public: currentPlayer.state.public },
          () =>
            Game.updateOne(
              { _id: gameId },
              { state: game.state },
              () =>
                game.players.forEach(player =>
                  io.to(player.userId).emit('gameAction', type, outputData, user.userId, maskForUser(_.cloneDeep(game), player.userId))
                )
            )
        );

        onError = onError ?? (() => null);

        switch (game.type) {
          case "skull":
            SkullService.validateAction(currentPlayer, game, type, data, onSuccess, onError);
            break;
          default:
            return;
        }
      })
  }

  var maskForUser = function (game, userId) {
    delete game.state.internal;
    game.state = game.state.public;

    game.players.forEach(player => {
      if (!player.userId == userId) {
        delete player.state.private;
        player.state = player.state.public;
      }
      else {
        player.state = {
          ...player.state.public,
          ...player.state.private
        }
      }
    });
    return game;
  }
}

module.exports = GameService;