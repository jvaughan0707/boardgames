const app = require('./app');
const debug = require('debug')('express-react:server');
const http = require('http');
const WebSocket = require('ws');

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
var gameService = require('./services/game-service');
var userService = require('./services/user-service');

const wss = new WebSocket.Server({ port: 3030 });

wss.on('connection', function connection(ws) {
  function messageOthers(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  function messageAll(data) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  function messageSender (data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
  
  ws.on('message', function incoming(message) {
    var data = JSON.parse(message);
    var info = data.info;
    switch (data.type) {
      case 'game':
          switch (data.action) {
              case 'create':
                gameService.create(info.gameType, info.user)
                      .then(game => messageAll({ 
                          info: { game },
                          action: 'create',
                          type: 'game'}))
                      .catch(err => messageSender(err))
                  break;
              case 'delete':
                gameService.remove(info.id)
                      .then(() => messageAll({ 
                          info : { id: info.id },
                          action: 'delete',
                          type: 'game'}))
                      .catch(err => messageSender(err))
                      break;
              case 'join':
                gameService.join(info.id, info.user)
                      .then(() => messageAll({ 
                          info,
                          action: 'join',
                          type: 'game'}))
                      .catch(err => messageSender(err))
                      break;
              case 'get':
                gameService.get()
                      .then((games) => messageSender({ 
                          info : { games },
                          action: 'get',
                          type: 'game',
                          id : data.id
                        }))
                      .catch(err => messageSender(err))
                      break;
              default:
                  break;
          }
        break;
      case 'user':
        break;
      default:
        break;
    }
  });
});