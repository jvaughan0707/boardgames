const Game = require('../models/game');
const Lobby = require('../models/lobby');
const SkullService = require('../game-types/skull');
const SpyfallService = require('../game-types/spyfall');
const _ = require('lodash');

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

class GameService {
  static getLobbies(cb) {
    return Lobby.find()
      .exec()
      .then((lobbies) => cb(lobbies.map(getLobbyObject)));
  }

  constructor(userId, io) {
    var getById = function (id) {
      return Game.findById(id)
        .exec();
    }

    var getType = function (game) {
      switch (game.type) {
        case 'skull':
          return new SkullService(game);
        case 'spyfall':
          return new SpyfallService(game);
        default:
          throw 'Invalid type';
      }
    }

    var saveAndEmit = function (game, stateChain) {
      stateChain = stateChain || [];
      game.markModified("state");
      game.markModified("players");
      game.save()
        .then(() => {
          game.players.forEach(player => {
            if (player.active) {
              var output = stateChain.map(x =>
                ({
                  ...x,
                  game: maskGameObject(_.cloneDeep(x.game), player.userId),
                })
              );
              io.to(player.userId).emit(
                'gameAction',
                output);
            }
          });
          stateChain.length = 0;
        });
    }

    var quit = game => {
      io.to(userId).emit('gameEnded');
      var player = game.players.find(p => p.userId == userId);

      if (player) {
        player.active = false;
        game.markModified("players");

        var remainingPlayers = game.players.filter(p => p.active);

        if (remainingPlayers.length > 0) {
          remainingPlayers.forEach(player => {
            io.to(player.userId).emit('playerQuit', userId);
          })

          if (!game.finished) {
            var stateChain = getType(game).onPlayerQuit(userId);
            saveAndEmit(game, stateChain);
          }
          else {
            game.save();
          }
        }
        else {
          game.remove();
        }
      }
    }

    this.getCurrentGame = cb => {
      return Game.findOne({ players: { $elemMatch: { userId, active: true } } })
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

    this.create = (type, displayName, rematchId) => {
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
          return new Lobby({...getType({type}).getLobbySettings(), rematchId}).save();
        })
        .then(lobby => {
          io.emit('lobbyCreated', getLobbyObject(lobby));
          this.join(lobby.id, displayName);
        })
        .catch(reason => {

        })
    }

    this.rematch = (gameId, displayName) => {
      Game.findById(gameId)
      .exec()
      .then(game => {
        if (game) {
          quit(game);
          Lobby.findOne({ rematchId: gameId })
          .exec()
          .then(lobby => {
            if (lobby) {
              this.join(lobby._id.toString(), displayName);
            }
            else {
              this.create(game.type, displayName, gameId)
            }
          });
        }
      });
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
      Game.findById(gameId)
        .exec()
        .then(game => {
          if (game) {
            quit(game);
          }
        });
    }

    this.start = (lobbyId) => {
      Lobby.findOne({ _id: lobbyId })
        .exec()
        .then(lobby => {
          if (!lobby) {
            return;
          }

          if (lobby.players.length < lobby.minPlayers) {
            return;
          }

          var game = new Game({
            type: lobby.type,
            title: lobby.title,
            players: lobby.players,
            state: { public: {}, internal: {} },
            finished: false,
            settings: lobby.settings
          })

          game.players = _.shuffle(game.players);

          game.players.forEach(player => {
            player.active = true;
            player.state = { public: {}, private: {}, internal: {} };
          });

          getType(game).initializeGame();

          game.save()
            .then(() => {
              game.players.forEach(player => {
                io.to(player.userId).emit('gameStarted', maskGameObject(game.toObject(), player.userId));
              });
              lobby.remove()
            });
        });
    }

    this.validateAction = (gameId, action, data, onError) => {
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
            onError('You are not currently active in this game')
            return;
          }

          onError = onError || (() => null);
          var stateChain = getType(game).validateAction(currentPlayer, action, data, onError);
          saveAndEmit(game, stateChain);
        })
    }
  }
}

module.exports = GameService;