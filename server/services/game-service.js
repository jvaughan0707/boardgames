const Game = require('../models/game');
const Lobby = require('../models/lobby');
const SkullService = require('./skull-service');
const ReadPreference = require('mongodb').ReadPreference;
const _ = require('lodash');

class GameService {
  static getLobbies(cb) {
    return Lobby.aggregate([
      {
        $addFields: { lobbyId: { "$toString": "$_id" } }
      },
      {
        $project:
          { _id: 0, _v: 0 }
      }
    ])
      .read(ReadPreference.NEAREST)
      .exec()
      .then(cb);
  }

  constructor(userId, io) {
    var getById = function (id) {
      return Game.findById(id)
        .read(ReadPreference.NEAREST)
        .exec();
    }
    var getLobbyObject = function (doc) {
      let lobby = doc.toObject();
      lobby.lobbyId = doc.id;
      delete lobby._id;
      delete lobby.__v;
      return lobby;
    }

    var getGameObject = function (doc, playerId) {
      let game = doc.toObject();
      game.gameId = doc.id;
      delete game._id;
      delete game.__v;

      delete game.state.internal;
      game.state = game.state.public;

      game.players.forEach(player => {
        delete player.state.internal;
        if (!player.userId == playerId) {
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

    this.getCurrentGame = cb => {
      return Game.findOne({ players: { $elemMatch: { userId, active: true } } })
        .read(ReadPreference.NEAREST)
        .exec()
        .then(game => {
          if (game) {
            cb(getGameObject(game, userId));
          }
          else {
            cb(null);
          }
        });
    }

    this.create = (type, displayName) => {
      if (!displayName) {
        return;
      }

      switch (type) {
        case 'skull':
          var lobby = SkullService.createLobby();
          break;
        default:
          return;
      }

      lobby.save()
        .then(() => {
          io.emit('lobbyCreated', getLobbyObject(lobby));
          this.join(lobby.id, displayName);
        });
    }

    this.join = (lobbyId, displayName) => {
      if (!displayName) {
        return;
      }

      Lobby.findById(lobbyId)
        .read(ReadPreference.NEAREST)
        .exec()
        .then(lobby => {
          if (lobby && !lobby.players.some(p => p.userId == userId) && lobby.players.length < lobby.maxPlayers) {
            var user = { userId, displayName }
            lobby.players.push(user);
            lobby.save()
              .then(() => {
                io.emit('lobbyPlayerJoined', user, lobbyId);
              });
          }
        });
    }

    this.leaveLobby = lobbyId => {
      Lobby.findById(lobbyId)
        .read(ReadPreference.NEAREST)
        .exec()
        .then(lobby => {
          if (lobby) {
            lobby.players = lobby.players.filter(p => p.userId != userId);
            if (lobby.players.length > 0) {
              io.emit('lobbyPlayerLeft', userId, lobbyId);
              game.save();
            }
            else {
              Lobby.deleteOne({ _id: lobbyId })
                .then(() => io.emit('lobbyDeleted', lobbyId));
            }
          }
        });
    }

    this.quit = gameId => {
      io.to(userId).emit('gameEnded')
      Game.findById(gameId)
        .read(ReadPreference.NEAREST)
        .exec()
        .then(game => {
          if (game) {
            game.players.forEach(player => {
              io.to(player.userId).emit('playerQuit', userId);
            })
            game.players.find(p => p.userId == userId).active = false;
            game.save();
          }
        });
    }

    this.start = lobbyId => {
      Lobby.findById(lobbyId)
        .read(ReadPreference.NEAREST)
        .exec()
        .then(lobby => {
          if (!lobby) {
            return;
          }

          if (lobby.players.length < lobby.minPlayers) {
            return;
          }

          var game = new Game({type: lobby.type, title: lobby.title, players: lobby.players, state: { public: {}, internal: {}}})

          // Shuffle the player order
          for (let i = game.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [game.players[i], game.players[j]] = [game.players[j], game.players[i]];
          }

          game.players.forEach(player => {
            player.active = true;
            player.state = { public: {}, private: {}, internal: {} };
          });

          switch (game.type) {
            case 'skull':
              SkullService.initializeGame(game);
              break;
            default:
              break;
          }
          game.save()
            .then(() =>
              game.players.forEach(player => {
                io.to(player.userId).emit('gameStarted', getGameObject(game, player.userId));
              })
            );
        });
    }

    this.validateAction = (gameId, type, data, onError) => {
      getById(gameId)
        .then(game => {
          if (!game) {
            return;
          }
          var currentPlayer = game.players.find(p => p.userId == userId);

          if (!currentPlayer) {
            onError('You are not in this game');
            return;
          }

          if (!currentPlayer.active) {
            onError('You are not currently ative in this game')
            return;
          }

          var onSuccess = outputData => {
            game.markModified("state");
            game.markModified("players");
            game.save()
              .then(() =>
                game.players.forEach(player => {
                  io.to(player.userId).emit('gameAction', type, outputData, userId, getGameObject(game, player.userId))
                })
              );
          }

          onError = onError || (() => null);
          switch (game.type) {
            case "skull":
              SkullService.validateAction(currentPlayer, game, type, data, onSuccess, onError);
              break;
            default:
              return;
          }
        })
    }
  }
}

module.exports = GameService;