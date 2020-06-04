const Game = require('../models/game');
const Lobby = require('../models/lobby');
const SkullService = require('./skull-service');
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
      .exec()
      .then(cb);
  }

  constructor(userId, io) {
    var getById = function (id) {
      return Game.findById(id)
        .exec();
    }
    var getLobbyObject = function (doc) {
      let lobby = doc.toObject();
      lobby.lobbyId = doc.id;
      delete lobby._id;
      delete lobby.__v;
      return lobby;
    }

    var maskGameObject = function (game, playerId) {
      game.gameId = game._id;
      delete game._id;
      delete game.__v;

      delete game.state.internal;
      game.state = game.state.public;

      game.players.forEach(player => {
        delete player.state.internal;
        if (player.userId !== playerId) {
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
      return Game.findOne({ players: { $elemMatch: { userId } } })
        .exec()
        .then(game => {
          if (game) {
            cb(maskGameObject(game.toObject(), userId));
          }
          else {
            cb(null);
          }
        });
    }

    this.create = (type, displayName) => {
      if (!displayName || displayName.length > 15) {
        throw 'Invalid display name';
      }

      Lobby.findOne({ players: { $elemMatch: { userId } } })
        .exec()
        .then(lobby => {
          if (lobby) {
            throw 'Already in a lobby';
          }
        })
        .then(() => {
          switch (type) {
            case 'skull':
              var lobby = SkullService.createLobby();
              break;
            default:
              throw 'Invalid type';
          }

          return lobby.save();
        })
        .then(lobby => {
          io.emit('lobbyCreated', getLobbyObject(lobby));
          this.join(lobby.id, displayName);
        })
        .catch(reason => {

        })
    }

    this.join = (lobbyId, displayName) => {
      if (!displayName || displayName.length > 15) {
        throw 'Invalid display name';
      }

      Lobby.findOne({ players: { $elemMatch: { userId } } })
        .exec()
        .then(lobby => {
          if (lobby) {
            throw 'Already in a lobby';
          }
        })
        .then(() => Lobby.findById(lobbyId).exec())
        .then(lobby => {
          if (lobby && lobby.players.length < lobby.maxPlayers) {
            var user = { userId, displayName }
            lobby.players.push(user);
            return lobby.save()
              .then(() => {
                io.emit('lobbyPlayerJoined', user, lobbyId);
              })
          }
          else {
            throw 'Unable to join lobby'
          }
        })

        .catch(reason => {

        });
    }

    this.leaveLobby = lobbyId => {
      Lobby.findById(lobbyId)
        .exec()
        .then(lobby => {
          if (lobby) {
            lobby.players = lobby.players.filter(p => p.userId != userId);
            if (lobby.players.length > 0) {
              io.emit('lobbyPlayerLeft', userId, lobbyId);
              lobby.save();
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
        .exec()
        .then(game => {
          if (game) {
            game.players = game.players.filter(p => p.userId !== userId);
            if (game.players.length > 0) {
              game.players.forEach(player => {
                io.to(player.userId).emit('playerQuit', userId);
              })
              SkullService.onPlayerQuit(game, userId);
              game.save();
            }
            else {
              Game.deleteOne({ _id: gameId });
            }
          }
        });
    }

    this.start = lobbyId => {
      Lobby.findOneAndDelete({ _id: lobbyId })
        .exec()
        .then(lobby => {
          if (!lobby) {
            return;
          }

          if (lobby.players.length < lobby.minPlayers) {
            return;
          }

          var game = new Game({ type: lobby.type, title: lobby.title, players: lobby.players, state: { public: {}, internal: {} }, finished: false })

          game.players = _.shuffle(game.players);

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
                io.to(player.userId).emit('gameStarted', maskGameObject(game.toObject(), player.userId));
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

          var onSuccess = stateChain => {
            stateChain = stateChain || [];
            game.markModified("state");
            game.markModified("players");
            game.save()
              .then(() =>
                game.players.forEach(player => {
                  var output = stateChain.map(x =>
                    ({
                      game: maskGameObject(_.cloneDeep(x.game), player.userId),
                      animate: x.animate
                    })
                  );
                  io.to(player.userId).emit(
                    'gameAction',
                    output);
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