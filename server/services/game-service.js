const Game = require('../models/game');
const Lobby = require('../models/lobby');
const Skull = require('../game-types/skull');
const Spyfall = require('../game-types/spyfall');
const Mascarade = require('../game-types/mascarade');
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
      .then((lobbies) => cb(lobbies.map(getLobbyObject)))
      .catch(err => console.error(new Date(), err));
  }

  constructor(userId, io) {
    var getById = function (id) {
      return Game.findById(id)
        .exec();
    }

    var getType = function (game) {
      switch (game.type) {
        case 'skull':
          return new Skull(game);
        case 'spyfall':
          return new Spyfall(game);
        case 'mascarade':
          return new Mascarade(game);
        default:
          throw 'Invalid type';
      }
    }

    var saveAndEmit = function (game, stateChain) {
      stateChain = stateChain || [];
      game.markModified("state");
      game.markModified("players");
      return game.save()
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

    var quit = async game => {
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
            return saveAndEmit(game, stateChain);
          }
          else {
            return await game.save();
          }
        }
        else {
          return await game.deleteOne();
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
        })
        .catch(err => console.error(new Date(), err, { userId }));
    }

    this.create = (type, displayName, rematchId) => {
      if (!displayName || displayName.length > 15) {
        console.error(new Date(), 'Invalid display name', { type, userId, displayName, rematchId });
        return;
      }

      return Lobby.findOne({ players: { $elemMatch: { userId } } })
        .exec()
        .then(lobby => {
          if (lobby) {
            throw 'Already in a lobby';
          }
        })
        .then(() => new Lobby({ ...getType({ type }).getLobbySettings(), rematchId, players: [] }).save())
        .then(lobby => {
          io.emit('lobbyCreated', getLobbyObject(lobby));
          this.join(lobby.id, displayName);
        })
        .catch(err => console.error(new Date(), err, { type, userId, displayName, rematchId }));
    }

    this.rematch = (gameId, displayName) => {
      var game = null;
      return Game.findById(gameId)
        .exec()
        .then(g => {
          game = g;
          if (game) {
            return quit(game)
          }
          else {
            throw 'Game not found';
          }
        })
        .then(() =>
          Lobby.findOne({ rematchId: gameId })
            .exec())
        .then(lobby => lobby ?
          this.join(lobby._id.toString(), displayName) :
          this.create(game.type, displayName, gameId))
        .catch(err => console.error(new Date(), err, { gameId, displayName, userId }));
    }

    this.join = (lobbyId, displayName) => {
      if (!displayName || displayName.length > 15) {
        console.error(new Date(), 'Invalid display name', { type, userId, displayName, rematchId });
        return;
      }

      return Lobby.findOne({ players: { $elemMatch: { userId } } })
        .exec()
        .then(lobby => {
          if (lobby) {
            throw 'Already in a lobby';
          }
        })
        .then(() => Lobby.findById(lobbyId).exec())
        .then(lobby => {
          if (lobby) {
            if (lobby.players.length < lobby.maxPlayers) {
              var user = { userId, displayName }
              lobby.players.push(user);
              return lobby.save()
                .then(() => {
                  io.emit('knock')
                  io.emit('lobbyPlayerJoined', user, lobbyId);
                })
            }
            else {
              throw 'Lobby has too many players'
            }
          }
          else {
            throw 'Lobby not found'
          }
        })
        .catch(err => console.error(new Date(), err, { lobbyId, userId }));
    }

    this.leaveLobby = lobbyId => {
      return Lobby.findById(lobbyId)
        .exec()
        .then(lobby => {
          if (lobby) {
            lobby.players = lobby.players.filter(p => p.userId != userId);
            if (lobby.players.length > 0) {
              io.emit('lobbyPlayerLeft', userId, lobbyId);
              return lobby.save();
            }
            else {
              return Lobby.deleteOne({ _id: lobbyId })
                .then(() => io.emit('lobbyDeleted', lobbyId));
            }
          }
          else {
            throw 'Lobby not found';
          }
        })
        .catch(err => console.error(new Date(), err, { lobbyId, userId }));
    }

    this.quit = gameId => {
      return Game.findById(gameId)
        .exec()
        .then(game => {
          if (game) {
            quit(game);
          }
          else {
            throw 'Game not found'
          }
        })
        .catch(err => console.error(new Date(), err, { gameId, userId }));
    }

    this.start = (lobbyId) => {
      return Lobby.findOne({ _id: lobbyId })
        .exec()
        .then(lobby => {
          if (!lobby) {
            throw 'Lobby not found';
          }

          if (lobby.players.length < lobby.minPlayers) {
            throw 'Not enough players';
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

          return game.save()
            .then(() => {
              game.players.forEach(player => {
                io.to(player.userId).emit('gameStarted', maskGameObject(game.toObject(), player.userId));
              });
              return lobby.deleteOne()
            });
        })
        .catch(err => console.error(new Date(), err, { lobbyId, userId }));
    }

    this.validateAction = (gameId, action, data, onError, retryCount) => {
      retryCount = retryCount || 0;
      var displayName = null;

      return getById(gameId)
        .then(game => {
          if (!game) {
            throw { name: "ActionError", message: "Game not found" };
          }
          var currentPlayer = game.players.find(p => p.userId == userId);

          if (!currentPlayer) {
            throw { name: "ActionError", message: 'You are not in this game' };
          }

          displayName = currentPlayer.displayName;

          if (!currentPlayer.active) {
            throw { name: "ActionError", message: 'You are not currently active in this game' };
          }

          var stateChain = getType(game).validateAction(
            currentPlayer,
            action,
            data);
          saveAndEmit(game, stateChain).catch(
            err => {
              if (err.name == "VersionError" && retryCount < 10) {
                this.validateAction(gameId, action, data, onError, retryCount + 1);
              }
              else {
                throw err;
              }
            });
        })
        .catch(err => {
          console.error(new Date(), err, { gameId, action, data, retryCount, userId, displayName })
          if (err.name == "ActionError") {
            onError(err.message);
          }
          else {
            onError("Unkown error. Please refresh and try again.")
          }
        });
    }
  }
}

module.exports = GameService;