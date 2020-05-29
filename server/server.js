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
const GameService = require('./services/game-service');
const UserService = require('./services/user-service');
require('./mongo').connect();

io.on('connection', (ws) => {
  ws.on('getOpenLobbies', GameService.getLobbies);

  var cookies = {};
  ws.request.headers.cookie &&
    ws.request.headers.cookie.split(';').forEach(function (cookie) {
      var parts = cookie.split('=');
      cookies[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  var { userId, userKey } = cookies;

  var userService = new UserService();
  userService.validate(userId, userKey)
    .then(user => {
      ws.join(user.userId);

      ws.emit('userValidated', user);
      var gameService = new GameService(user.userId, io);

      ws.on('createLobby', gameService.create);

      ws.on('joinLobby', gameService.join);

      ws.on('leaveLobby', gameService.leaveLobby);
      
      ws.on('quit', gameService.quit);

      ws.on('getCurrentGame', gameService.getCurrentGame);

      ws.on('startGame', gameService.start);

      ws.on('gameAction', gameService.validateAction);
    })
});
