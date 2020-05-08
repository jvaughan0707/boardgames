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

var gameService = require('./services/game-service');
var userService = require('./services/user-service');

io.on('connection', (ws) => {
  var user = null;
  var getUser;

  function addListeners () {

    ws.on('createLobby', ({type, title}, cb) => 
      gameService.create(type, title, user)
        .then(lobby=> {
          io.emit('lobbyCreated', lobby);
          ws.emit('joinedLobby');
          ws.join(lobby.gameId);
          cb && cb(lobby);
        })
    ); 

    ws.on('deleteLobby', (id) => 
      gameService.remove(id, user)
      .then(() => { 
        io.emit('lobbyDeleted', id);
        io.to(id).emit('leftLobby');
      })
    );

    ws.on('joinLobby', (gameId) => {
      ws.join(gameId);
      gameService.join(gameId, user)
      .then(() => {
        io.emit('lobbyPlayerJoined', user, gameId );
        ws.emit('joinedLobby');
      });
    });

    ws.on('leaveLobby', (gameId) => {
      ws.leave(gameId);
      gameService.leave(gameId, user).then(() => {
        io.emit('lobbyPlayerLeft', user, gameId );
        ws.emit('leftLobby');
      });
    });
    
    ws.on('getOpenLobbies', (cb) =>
      gameService.getLobbies()
      .then(lobbies => { 
        cb(lobbies);
      })
    );

    ws.on('getUserGameStatus', (cb) =>
      gameService.getUserGameStatus(user.userId)
        .then(result => { 
          cb(result);
        })
    );

    ws.on('getCurrentGame', (cb) =>
      gameService.getCurrentGame(user.userId)
      .then(game => { 
        cb(game);
      })
    );

    ws.on('startGame', (gameId) => 
      gameService.start(gameId)
      .then(() => io.to(gameId).emit('gameStarted'))
    );
  }
  var cookies = {};

  ws.request.headers.cookie && 
  ws.request.headers.cookie.split(';').forEach(function(cookie) {
    var parts = cookie.split('=');
    cookies[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  var { displayName, userId, userKey } = cookies;

  if (displayName) {
    getUser = userService
      .validate({ displayName, userId, userKey })
      .then((result) => { 
        addListeners();
        user = {displayName, userId: result.userId};
        return result;
      })
  }
  

  ws.on('getUser', (cb) => {
    if (getUser) {
      getUser.then(u => cb(u));
    }
    else {
      cb(null);
    }
  });

  ws.on('createUser', (displayName, cb) => {
    if (user || getUser) {
      //throw
    }
    else {
       getUser = userService.create(displayName)
        .then((result) => { 
          addListeners();
          user = result;
          cb(result);
          return result;
        });
    }
  });
       

  // if (getResult) {
  //   getResult.then(result => messageSender({ 
  //     success: true,
  //     info : result,
  //     requestId : data.requestId }))
  //   .catch(err => messageSender({ 
  //     success: false,
  //     info : {err},
  //     requestId : data.requestId }));
  // }
});