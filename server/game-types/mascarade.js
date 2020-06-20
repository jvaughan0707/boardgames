const _ = require('lodash');

class Mascarade {
  constructor(game) {
    var stateChain = [];

    var addCheckpoint = (animate, pause) => stateChain.push({ game: game.toObject(), animate, pause })

    var setNextTurnPlayer = (currentPlayer) => {
      game.state.internal.incorrectPlayers.forEach(p => moveMoney(1, game.state.public.courtCoins, p));

      currentPlayer.state.public.currentTurn = false;
      game.players.forEach(p => {
        delete p.state.private.card;
        p.state.public.card.revealed = false;
        p.state.public.claim = null;
        p.state.public.accept = null;
      });
      game.state.public.currentTurnIndex++;
      game.state.public.currentTurnIndex %= game.players.length;
      game.players[game.state.public.currentTurnIndex].state.public.currentTurn = true;

      addCheckpoint(true);
      game.players.forEach(p => {
        p.state.public.card.value = null;
      })

      addCheckpoint(false);
    }

    var createCoins = (number, key) => {
      key = key || 0;
      return new Array(number).fill(null).map((x, i) => ({ key: i + key, value: 1 }));
    }

    var moveMoney = (amount, to, from) => {
      if (to.userId) {
        to = to.state.public.coins;
      }
      if (from.userId) {
        from = from.state.public.coins;
      }

      if (amount > from.length) {
        amount = from.length;
      }

      to.unshift(...from.splice(0, amount).reverse());

      game.players.forEach(p => {
        var money = p.state.public.coins.length;
        if (money <= 0 || money >= 13) {
          game.finished = true;
        }
      })
    }

    var takeBankMoney = (amount, to) => {
      var key = game.state.public.bankCoins[4].key + 1;
      game.state.public.bankCoins.push(...createCoins(amount, key));
      moveMoney(amount, to, game.state.public.bankCoins);
    }

    var getDefaultCharacters = (playerCount) => {
      // 0:"judge", 1:"bishop", 2:"king", 3:"fool", 4:"queen", 5:"theif", 6:"witch", 7:"spy", 8:"peasant", 9:"cheat", 10:"inquisitor", 11:"widow"]
      var baseCharacters = [0, 1, 2, 4];
      switch (playerCount) {
        case 4:
          return [...baseCharacters, 9, 5];
        case 5:
          return [...baseCharacters, 6, 9];
        case 6:
          return getDefaultCharacters(5);
        case 7:
          return [...baseCharacters, 6, 3, 5];
        case 8:
          return [...baseCharacters, 6, 3, 8, 8];
        case 9:
          return [...getDefaultCharacters(8), 9];
        case 10:
          return [...getDefaultCharacters(9), 7];
        case 11:
          return [...getDefaultCharacters(10), 10];
        case 12:
          return [...getDefaultCharacters(11), 11];
        case 13:
          return [...getDefaultCharacters(12), 5];
        default:
          throw 'Invalid player count';
      }
    }

    this.getLobbySettings = () =>
      ({ type: 'mascarade', title: 'Mascarade', minPlayers: 4, maxPlayers: 13 });

    this.initializeGame = () => {
      var gameCharacters = _.shuffle(getDefaultCharacters(game.players.length));
      var bankCoins = createCoins(5 + game.players.length);
      game.state = { public: { bankCoins, courtCoins: [], gameCharacters, started: false, currentTurnIndex: 0 }, internal: {} };

      game.players.forEach((p, i) => {
        var playerCharacter = gameCharacters.pop();
        p.state.public = { currentTurn: i == 0, coins: [], card: { value: playerCharacter, revealed: true }, mustSwap: i < 4, accept: null, actionTaken: false };
        p.state.private = {};
        p.state.internal = { card: { value: playerCharacter }}
      });

      if (gameCharacters.length > 0) {
        game.state.public.cards = gameCharacters.map(c => ({ value: c, revealed: true }));
      }
    }

    this.onPlayerQuit = (userId) => {
      return stateChain;
    }

    this.validateAction = (currentPlayer, action, data) => {
      var checkClaimResponses = () => {
        var remaining = game.players.filter(p => !p.state.public.accept)
        if (remaining.every(p => p.state.public.claim)) {
          if (remaining.length > 1) {
            remaining.forEach(p => {
              p.state.public.card.value = p.state.internal.card.value;
              p.state.public.card.revealed = true;
            });
            var correct = remaining.filter(p => p.state.internal.card.value === p.state.public.claim);
            game.state.internal.incorrectPlayers = remaining.filter(p => p.state.internal.card.value !== p.state.public.claim);
            var resolved = false;
            correct.forEach(player => {
              let others = game.players.filter(p => p !== player);
              switch (player.state.public.claim) {
                case 0: //judge
                  moveMoney(Infinity, player, game.state.public.courtCoins)
                  resolved = true;
                  break;
                case 1: //bishop
                  var maxMoney = Math.max(...others.map(p => p.state.public.coins));
                  var richestPlayers = others.filter(p => p.state.public.coins === maxMoney);
                  if (richestPlayers.length > 1) {
                    player.state.public.playerOptions = richestPlayers.map(p => p.userId);
                  }
                  else {
                    moveMoney(2, player, richestPlayers[0]);
                    resolved = true;
                  }
                  break;
                case 2: // king
                  takeBankMoney(3, player);
                  resolved = true;
                  break;
                case 3: //fool
                  takeBankMoney(1, player);
                  // choose 2 cards
                  currentPlayer.state.public.selectedCards = [null, null];
                  break;
                case 4: //queen
                  takeBankMoney(2, player);
                  resolved = true;
                  break;
                case 5: //theif
                  var next = (player.__index + 1) % game.players.length;
                  var prev = (player.__index - 1 + game.players.length) % game.players.length;
                  moveMoney(1, player, game.players[next]);
                  moveMoney(1, player, game.players[prev]);
                  resolved = true;
                  break;
                case 6: //witch
                  player.state.public.playerOptions = others.map(p => p.userId);
                  break;
                case 7: //spy
                  currentPlayer.state.public.selectedCards = [currentPlayer.userId, null];
                  // choose 1 card
                  break;
                case 8: //peasant
                  if (correct.length > 1) {
                    takeBankMoney(2, player)
                  }
                  else {
                    takeBankMoney(1, player);
                  }
                  resolved = true;
                  break;
                case 9: //cheat
                  if (player.state.public.coins.length >= 10) {
                    game.finished = true;
                    game.state.public.winner = player;
                  }
                  break;
                case 10: //inquisitor
                  player.state.public.playerOptions = others.map(p => p.userId);
                  break;
                case 11: //widow
                  var amount = Math.max(0, 10 - player.state.public.coins.length);

                  if (amount > 0) {
                    takeBankMoney(amount, player);
                  }
                  resolved = true;
                  break;
                default:
                  throw { name: "ActionError", message: 'Invalid character' };
              }
            });

            if (resolved) {
              setNextTurnPlayer();
            }
          }
        }
      }

      switch (action) {
        case "accept":
          if (currentPlayer.state.public.accept) {
            throw { name: "ActionError", message: 'You have already accepted' };
          }

          if (currentPlayer.state.public.claim) {
            throw { name: "ActionError", message: 'You have already challenged' };
          }

          if (!game.started) {
            currentPlayer.state.public.accept = true;

            if (game.players.every(p => p.state.public.accept)) {
              game.started = true;
              game.players.forEach(p => {
                moveMoney(6, p.state.public.coins, game.state.public.bankCoins);
                p.state.public.card.revealed = false;
              });

              game.state.public.cards.forEach(c => { c.revealed = false });

              addCheckpoint(true);

              game.players.forEach(p => {
                p.state.public.card.value = null;
              });

              game.state.public.cards.forEach(c => { c.value = null });
              addCheckpoint(false);
            }
          }
          else if (currentPlayer.state.private.card.revealed || currentPlayer.state.private.revealedCards) {
            currentPlayer.state.private.card.revealed = false;
            currentPlayer.state.private.revealedCards.forEach(c => { c.revealed = false });

            addCheckpoint(true);
            currentPlayer.state.private.card.value = null;
            currentPlayer.state.private.revealedCards = null;
            addCheckpoint(false);
          }
          else {
            var claimedCharacter = game.players[game.state.public.currentTurnIndex].state.public.claim;
            if (!claimedCharacter) {
              throw { name: "ActionError", message: 'There is nothing to accept at this time' };
            }
            currentPlayer.state.public.accept = true;

            checkClaimResponses();
          }
          break;
        case "challenge":
          if (currentPlayer.state.public.accept) {
            throw { name: "ActionError", message: 'You have already accepted' };
          }
          var claimedCharacter = game.players[game.state.public.currentTurnIndex].state.public.claim;

          if (!claimedCharacter) {
            throw { name: "ActionError", message: 'There is no active claim so you cannot challenge now' };
          }
          else if (currentPlayer.state.public.claim) {
            throw { name: "ActionError", message: 'You have already claimed' };
          }
          else {
            currentPlayer.state.public.claim = claimedCharacter;
            checkClaimResponses();
          }
          break
        case "swap":
          if (!currentPlayer.state.public.currentTurn) {
            throw { name: "ActionError", message: 'Its not your turn' };
          }

          if (currentPlayer.state.public.actionTaken) {
            throw { name: "ActionError", message: 'You have already chosen your action for this turn' };
          }

          currentPlayer.state.public.actionTaken = true;
          currentPlayer.state.public.selectedCards = [currentPlayer.userId, null];

          break;
        case "inspect":
          if (!currentPlayer.state.public.currentTurn) {
            throw { name: "ActionError", message: 'Its not your turn' };
          }

          if (currentPlayer.state.public.mustSwap) {
            throw { name: "ActionError", message: 'You must swap - or not' };
          }

          if (currentPlayer.state.public.actionTaken) {
            throw { name: "ActionError", message: 'You have already chosen your action for this turn' };
          }

          currentPlayer.state.public.actionTaken = true;
          currentPlayer.state.private.card = { value: currentPlayer.state.internal.card.value, revealed: true };

          break;
        case "claim":
          if (!currentPlayer.state.public.currentTurn) {
            throw { name: "ActionError", message: 'Its not your turn' };
          }

          if (currentPlayer.state.public.mustSwap) {
            throw { name: "ActionError", message: 'You must swap - or not' };
          }

          if (currentPlayer.state.public.actionTaken) {
            throw { name: "ActionError", message: 'You have already chosen your action for this turn' };
          }

          if (game.state.public.characters.indexOf(data) < 0) {
            throw { name: "ActionError", message: 'The chosen character is not in the game' };
          }

          currentPlayer.state.public.claim = data;
          currentPlayer.state.public.actionTaken = true;
          break;
        case "selectCard":
          var cards = currentPlayer.state.public.selectedCards
          if (cards) {
            if (data) {
              if (data.userId) {
                if (!game.players.find(p => p.userId == data.userId)) {
                  throw { name: "ActionError", message: 'Player not found' };
                }
              }
              else if (data.index != null) {
                if (!game.state.public.cards[data.index]) {
                  throw { name: "ActionError", message: 'Invalid card selection' };
                }
              }

              if (!cards[0]) {
                cards[0] = data;
              }
              else if (!cards[1]) {
                cards[1] = data;
                resolveEffect();
              }
              else {
                throw { name: "ActionError", message: 'You have already selected 2 cards' };
              }
            }
          }

          break;
        case "selectPlayer":
          if (currentPlayer.state.public.playerOptions) {
            currentPlayer.state.public.selectedPlayer = data;
          }
          break;
        case "swapOrNot":
          var cards = currentPlayer.state.public.selectedCards;
          if (cards && cards[0] && cards[1]) {
            if (data) {
              if (cards[0].userId) {
                var left = game.players.find(p => p.userId == cards[0].userId).state.internal.card;
              }
              else {
                var left = game.state.public.cards[cards[0].index];
              }

              if (cards[1].userId) {
                var right = game.players.find(p => p.userId == cards[1].userId).state.internal.card;
              }
              else {
                var right = game.state.public.cards[cards[1].index];
              }

              var temp = left.value;
              left.value = right.value;
              right.value = temp;
            }

            currentPlayer.state.public.selectedCards = null;
          }
          break
        default:
          throw 'Invalid action';
      }

      return stateChain;
    }
  }
}

module.exports = Mascarade;