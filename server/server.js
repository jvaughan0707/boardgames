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
var gameService = require('./services/game-service');
var userService = require('./services/user-service');

const wss = new WebSocket.Server({ port: 3030 });

var clients = {};
var channels = {};

wss.on('connection', function connection(ws, request, client) {
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

  function parseCookies (req) {
    var list = {},
        cookie = req.headers.cookie;

    cookie && cookie.split(';').forEach(function( cookie ) {
      var parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
  }

  var { displayName, userId, userKey } = parseCookies(request);

  if (displayName) {
    if (userId && userKey) {
      userService.validate({ displayName, userId, userKey })
         .then(success => { 
           if (success) {
              clients[userId] = client;
           }
           else {

           }
         })
         .catch(err => {})
    }
    else {
      // new user
      // clients[userId] = client;
    }
  }
  else {

  }
  
  ws.on('message', function incoming(message) {

    var data = JSON.parse(message);
    var info = data.info;
    var getResult;
    switch (data.type) {
      case 'game':
        switch (data.action) {
          case 'create':
            getResult = gameService.create(info.gameType, info.user)
              .then(game => {
                messageAll({ 
                  info: { game },
                  action: 'create',
                  type: 'game'});
                  
                return null;
              })
            break;
          case 'delete':
            getResult = gameService.remove(info.id)
              .then(() => { 
                messageAll({ 
                  info : { id: info.id },
                  action: 'delete',
                  type: 'game'});
                  
                  return null;
                });
            break;
          case 'join':
            getResult = gameService.join(info.id, info.user)
              .then(() => {
                messageAll({ 
                  info,
                  action: 'join',
                  type: 'game'});

                  return null;
                });
            break;
          case 'get':
            getResult = gameService.get()
             .then(games => { return { games }});
            break;
          default:
            break;
        }
        break;
      case 'user':
        switch (data.action) {
          case 'create':
            getResult = userService.create(info.displayName)
              .then(user => { return { user }});
              break;
          case 'validate':
            getResult = userService.validate(info.user)
              .then(success => { return { success }});
            break;
          default: 
            break;
        }
        break;
      default:
        break;
    }

    if (getResult) {
      getResult.then(result => messageSender({ 
        success: true,
        info : result,
        requestId : data.requestId }))
      .catch(err => messageSender({ 
        success: false,
        info : {err},
        requestId : data.requestId }));
    }
  });
});