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
const WebSocket = require('ws');
const io = require('socket.io')(server);

var gameService = require('./services/game-service');
var userService = require('./services/user-service');

var channels = {};

io.on('connection', (ws) => {
  var user = null;
  var getUser;

  function addListeners () {

    ws.on('createGame', (gameType, cb) => 
      gameService.create(gameType, user)
      .then(game=> {
        ws.emit('createGame', game);
        cb && cb();
      })
    ); 

    ws.on('deleteGame', (id, cb) => 
      gameService.remove(id)
      .then(() => { 
        ws.emit('deleteGame', id);
        cb && cb();
      })
    );

    ws.on('joinGame', (gameId, cb) => 
      gameService.join(gameId, user)
      .then(() => {
        ws.emit('joinGame', id);
        cb && cb();
      })
    );
    
    ws.on('getGames', (cb) =>
      gameService.get()
      .then(games => { 
        cb(games);
      })
    );
  }

  if (!user) {
    var list = {},
    cookie = ws.request.headers.cookie;

    cookie && cookie.split(';').forEach(function( cookie ) {
      var parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    var { displayName, userId, userKey } = list;

    if (displayName) {
      getUser = userService
        .validate({ displayName, userId, userKey })
        .then((result) => { 
          addListeners();
          user = result;
          return result;
        })
    }
  }
  

  ws.on('getUser', (cb) => {
    if (user) {
      cb(user);
    }
    else if (getUser) {
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
       userService.create(displayName)
      .then((result) => { 
        addListeners();
        user = result;
        cb(result);
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