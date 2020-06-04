const io = require('socket.io')(server);
const GameService = require('./services/game-service');
const UserService = require('./services/user-service');

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
