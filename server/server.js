const app = require('./app');
const debug = require('debug')('express-react:server');
const http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3001');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

/**
 * Web sockets
 */
const io = require('socket.io')(server);
const GameService = require('./services/game-service').GameService;
const UserService = require('./services/user-service').UserService;

const clients = new Map();

io.on('connection', (ws) => {
  ws.on('disconnect', function() {
    clients.delete(ws);
  });

  function onUserValidated (user) {
    delete user.userKey;
    clients.set(ws, user);

    var gameService = new GameService(user);

    ws.on('createLobby', ({type, title}, cb) => 
      gameService.create(type, title, lobby => {
        io.emit('lobbyCreated', lobby);
        ws.emit('gameUpdated', lobby);
        ws.join(lobby.gameId);
        cb && cb(lobby);
      })
    ); 

    ws.on('joinLobby', (gameId) => {
      ws.join(gameId);
      gameService.join(gameId, game => {
        io.emit('lobbyPlayerJoined', user, gameId );
        ws.emit('gameStatusChanged', game);
      });
    });

    ws.on('leaveLobby', (gameId) => {
      ws.leave(gameId);
      gameService.leave(gameId, (newOwnerId) => {
        io.emit('lobbyPlayerLeft', user.userId, gameId, newOwnerId);
        ws.emit('gameStatusChanged', null);
      });
    });

    ws.on('quitGame', (gameId) => {
      ws.leave(gameId);
      gameService.leave(gameId, () => {
        io.to(gameId).emit('playerLeft', user.userId );
        ws.emit('gameStatusChanged', null);
      });
    });

    ws.on('getOpenLobbies', (cb) =>
      gameService.getLobbies(cb)
    );

    ws.on('getCurrentGame', (cb) => 
      gameService.getCurrentGame(game => {
        if (game) {
          ws.join(game.gameId);
        }
        cb(game);
      })
    );

    ws.on('startGame', (gameId) => 
      gameService.start(gameId, game => 
        io.to(gameId).emit('gameStatusChanged', game)
      )
    );

    ws.on('gameAction', (gameId, type, data) => 
      gameService.validateAction(id, type, data, () => {
        io.sockets.clients(gameId).foreach(client => {
          var userId = clients.get(client).userId;
          io.to(userId).emit('gameAction', type, data, user.userId, gameService.maskForUser(game, userId))
        });
      })
    );
  }

  var userService = new UserService();

  ws.on('validateUser', (user, cb) => {
    if (clients.get(ws)) {
      cb(clients.get(ws));
    }
    else {
      userService.validate(user, result => { 
        cb(result);
        onUserValidated(result);
      })
    }
  });
  
  ws.on('createUser', (displayName, cb) => {
    if (!clients.get(ws)) {
       userService.create(displayName, result => { 
          cb(result);         
          onUserValidated(result);
        });
    }
  });
});
