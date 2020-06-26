const _ = require('lodash');

class Mascarade {
  constructor(game) {
    var stateChain = [];

    var addCheckpoint = (animate, pause) => stateChain.push({ game: game.toObject(), animate, pause })

    var setNextTurnPlayer = () => {
      game.state.internal.incorrectPlayers.forEach(player => {
        if (game.players.indexOf(player) - 1) {
          player = game.players.find(p => p.userId == player.userId);
        }
        moveMoney(1, game.state.public.courtCoins, player)
      });
      game.state.internal.incorrectPlayers = [];
      game.state.internal.correctPlayers = [];
      game.players.forEach(p => {
        p.state.private.revealedCards = null;
        p.state.public.card.revealed = false;
        p.state.public.actionTaken = false;
        p.state.public.claim = null;
        p.state.public.accept = null;
      });
      game.players[game.state.public.currentTurnIndex].state.public.currentTurn = false;
      game.state.public.currentTurnIndex++;
      game.state.public.currentTurnIndex %= game.players.length;
      game.players[game.state.public.currentTurnIndex].state.public.currentTurn = true;

      addCheckpoint(true);
      game.players.forEach(p => {
        p.state.public.card.value = null;
      })

      addCheckpoint(false);
    }

    var createCoins = (amount, key) => {
      key = key || 0;
      return new Array(amount).fill(null).map((x, i) => ({ key: key + i, value: 1 })).reverse();
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

      for (let i = 0; i < amount; i++) {
        to.push(from.pop());
      }

      if (game.state.public.started) {
        game.players.forEach(p => {
          var money = p.state.public.coins.length;
          if (money <= 0 || money >= 13) {
            game.finished = true;
          }
        });
      }
    }

    var takeBankMoney = (amount, to) => {
      var key = game.state.public.bankCoins[0].key + 1;
      game.state.public.bankCoins.unshift(...createCoins(amount, key));
      moveMoney(amount, to, game.state.public.bankCoins);
    }

    var getDefaultCharacters = (playerCount) => {
      // 0:"judge", 1:"bishop", 2:"king", 3:"fool", 4:"queen", 5:"thief", 6:"witch", 7:"spy", 8:"peasant", 9:"cheat", 10:"inquisitor", 11:"widow"]
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
      var bankCoins = createCoins(5 + game.players.length * 6);
      game.state = {
        public: { bankCoins, courtCoins: [], characters: gameCharacters.slice(), started: false, currentTurnIndex: 0 },
        internal: { correctPlayers: [], incorrectPlayers: [] }
      };

      game.players.forEach((p, i) => {
        var playerCharacter = gameCharacters.pop();
        p.state.public = { currentTurn: i == 0, coins: [], card: { value: playerCharacter, revealed: true }, mustSwap: i < 4, accept: null, actionTaken: false };
        p.state.private = { revealedCards: null };
        p.state.internal = { card: { value: playerCharacter } }
      });

      if (gameCharacters.length > 0) {
        game.state.public.cards = gameCharacters.map(c => ({ value: c, revealed: true }));
        game.state.internal.cards = gameCharacters.map(c => ({ value: c }));
      }
    }

    this.onPlayerQuit = (userId) => {
      return stateChain;
    }

    this.validateAction = (currentPlayer, action, data) => {
      var checkClaimResponses = () => {
        var remaining = game.players.filter(p => !p.state.public.accept)
        if (remaining.every(p => p.state.public.claim !== null)) {
          if (remaining.length > 1) {
            remaining.forEach(p => {
              p.state.public.card.value = p.state.internal.card.value;
              p.state.public.card.revealed = true;
            });
            game.state.internal.incorrectPlayers = remaining.filter(p => p.state.internal.card.value !== p.state.public.claim);
            game.state.internal.correctPlayers = remaining.filter(p => p.state.internal.card.value === p.state.public.claim);
            addCheckpoint(true, 2000);

            if (game.state.internal.correctPlayers.length == 0) {
              setNextTurnPlayer();
            }
          }
          else {
            game.state.internal.correctPlayers = remaining;
          }
          game.state.internal.correctPlayers.forEach(player => {
            let others = game.players.filter(p => p !== player);
            switch (player.state.public.claim) {
              case 0: //judge
                moveMoney(Infinity, player, game.state.public.courtCoins)
                addCheckpoint(true);
                setNextTurnPlayer();
                break;
              case 1: //bishop
                var maxMoney = Math.max(...others.map(p => p.state.public.coins.length));
                var richestPlayers = others.filter(p => p.state.public.coins.length === maxMoney);
                if (richestPlayers.length > 1) {
                  player.state.public.playerOptions = richestPlayers.map(p => p.userId);
                }
                else {
                  moveMoney(2, player, richestPlayers[0]);
                  addCheckpoint(true);
                  setNextTurnPlayer();
                }
                break;
              case 2: // king
                takeBankMoney(3, player);
                addCheckpoint(true);
                setNextTurnPlayer();
                break;
              case 3: //fool
                takeBankMoney(1, player);
                // choose 2 cards
                currentPlayer.state.public.selectedCards = [null, null];
                break;
              case 4: //queen
                takeBankMoney(2, player);
                addCheckpoint(true);
                setNextTurnPlayer();
                break;
              case 5: //thief
                var next = (player.__index + 1) % game.players.length;
                var prev = (player.__index - 1 + game.players.length) % game.players.length;
                moveMoney(1, player, game.players[next]);
                moveMoney(1, player, game.players[prev]);
                addCheckpoint(true);
                setNextTurnPlayer();
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
                addCheckpoint(true);
                setNextTurnPlayer();
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
                addCheckpoint(true);
                setNextTurnPlayer();
                break;
              default:
                throw { name: "ActionError", message: 'Invalid character' };
            }
          });
          addCheckpoint(false);
        }
      }

      var resolveEffect = () => {
        game.state.internal.correctPlayers.forEach(player => {
          if (game.players.indexOf(player) - 1) {
            player = game.players.find(p => p.userId == player.userId);
          }

          switch (player.state.public.claim) {
            case 1: //bishop
              var selectedPlayer = game.players.find(p => p.userId == currentPlayer.state.selectedPlayer)
              moveMoney(2, player, selectedPlayer);
              addCheckpoint(true);
              setNextTurnPlayer();
              break;
            case 6: //witch
              var selectedPlayer = game.players.find(p => p.userId == currentPlayer.state.selectedPlayer)
              var diff = (selectedPlayer.state.public.coins.length - player.state.public.coins.length);
              if (diff > 0) {
                moveMoney(diff, player, selectedPlayer);
              }
              else {
                moveMoney(-diff, selectedPlayer, player);
              }
              addCheckpoint(true);
              setNextTurnPlayer();
              break;
            case 7: //spy
              player.state.private.revealedCards = player.state.public.selectedCards.map(c =>
                c.userId ? ({ userId: c.userId, value: game.players.find(p => p.userId == c.userId).state.internal.card.value, revealed: true })
                  : ({ index: c.index, value: game.state.internal.cards[c.index].value, revealed: true }));
              addCheckpoint(true);
              break;
            case 10: //inquisitor
              addCheckpoint(false);
              break;
            default:
              throw { name: "ActionError", message: 'Invalid character' };
          }
        })
      }

      switch (action) {
        case "reset":
          this.initializeGame();
          addCheckpoint(true);
          break;
        case "accept":
          if (currentPlayer.state.public.accept) {
            throw { name: "ActionError", message: 'You have already accepted' };
          }

          if (currentPlayer.state.public.claim !== null) {
            throw { name: "ActionError", message: 'You have already challenged' };
          }

          if (!game.state.public.started) {
            currentPlayer.state.public.accept = true;

            if (game.players.every(p => p.state.public.accept)) {
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
              game.state.public.started = true;
            }
            addCheckpoint(false);
          }
          else if (currentPlayer.state.private.revealedCards) {
            currentPlayer.state.private.revealedCards.forEach(c => { c.revealed = false });

            addCheckpoint(true);

            currentPlayer.state.private.revealedCards = null;

            if (currentPlayer.state.public.claim == null) {
              setNextTurnPlayer();
            }

            addCheckpoint(false);
          }
          else {
            var claimedCharacter = game.players[game.state.public.currentTurnIndex].state.public.claim;
            if (claimedCharacter === null) {
              throw { name: "ActionError", message: 'There is nothing to accept at this time' };
            }
            currentPlayer.state.public.accept = true;

            checkClaimResponses();
          }
          addCheckpoint(false);
          break;
        case "challenge":
          if (currentPlayer.state.public.accept) {
            throw { name: "ActionError", message: 'You have already accepted' };
          }
          var claimedCharacter = game.players[game.state.public.currentTurnIndex].state.public.claim;

          if (claimedCharacter == null) {
            throw { name: "ActionError", message: 'There is no active claim so you cannot challenge now' };
          }
          else if (currentPlayer.state.public.claim != null) {
            throw { name: "ActionError", message: 'You have already claimed' };
          }
          else {
            currentPlayer.state.public.claim = claimedCharacter;
            checkClaimResponses();
          }
          addCheckpoint(false);
          break
        case "swap":
          if (!currentPlayer.state.public.currentTurn) {
            throw { name: "ActionError", message: 'Its not your turn' };
          }

          if (currentPlayer.state.public.actionTaken) {
            throw { name: "ActionError", message: 'You have already chosen your action for this turn' };
          }

          currentPlayer.state.public.mustSwap = false;
          currentPlayer.state.public.actionTaken = true;
          currentPlayer.state.public.selectedCards = [{ userId: currentPlayer.userId }, null];

          addCheckpoint(true);
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
          currentPlayer.state.private.revealedCards = [{ userId: currentPlayer.userId, value: currentPlayer.state.internal.card.value, revealed: true }];
          addCheckpoint(true);

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
          addCheckpoint(false);

          break;
        case "selectCard":
          var cards = currentPlayer.state.public.selectedCards
          if (cards) {
            if (data) {
              if (data.userId) {
                if (!game.players.find(p => p.userId == data.userId)) {
                  throw { name: "ActionError", message: 'Player not found' };
                }
                if (cards[0] && cards[0].userId == data.userId) {
                  throw { name: "ActionError", message: 'You have already selected this card' };
                }
              }
              else if (data.index != null) {
                if (!game.state.public.cards[data.index]) {
                  throw { name: "ActionError", message: 'Invalid card selection' };
                }
                if (cards[0] && cards[0].index == data.index) {
                  throw { name: "ActionError", message: 'You have already selected this card' };
                }
              }

              if (!cards[0]) {
                cards[0] = data;
                addCheckpoint(true);
              }
              else if (!cards[1]) {
                cards[1] = data;
                addCheckpoint(true);

                if (currentPlayer.state.public.claim !== null) {
                  resolveEffect();
                }
              }
              else {
                throw { name: "ActionError", message: 'You have already selected 2 cards' };
              }
            }
          }
          else {
            throw { name: "ActionError", message: 'Cannot select cards at this time' };
          }
          addCheckpoint(false);

          break;
        case "selectPlayer":
          if (currentPlayer.state.public.playerOptions) {
            if (currentPlayer.state.public.playerOptions.indexOf(data) >= 0) {
              currentPlayer.state.public.selectedPlayer = data;
              resolveEffect();
            }
            else {
              throw { name: "ActionError", message: 'Selected player is not an option' };
            }
          }
          else {
            throw { name: "ActionError", message: 'Cannot select a player at this time' };
          }
          break;
        case "swapOrNot":
          if (currentPlayer.state.private.revealedCards) {
            throw { name: "ActionError", message: 'Cant swap at this time' };
          }
          var cards = currentPlayer.state.public.selectedCards;
          if (cards && cards[0] && cards[1]) {
            if (data) {
              if (cards[0].userId) {
                var left = game.players.find(p => p.userId == cards[0].userId).state.internal.card;
              }
              else {
                var left = game.state.internal.cards[cards[0].index];
              }

              if (cards[1].userId) {
                var right = game.players.find(p => p.userId == cards[1].userId).state.internal.card;
              }
              else {
                var right = game.state.internal.cards[cards[1].index];
              }

              var temp = left.value;
              left.value = right.value;
              right.value = temp;
            }

            currentPlayer.state.public.selectedCards = null;

            addCheckpoint(true);
            setNextTurnPlayer();
          }
          addCheckpoint(false);
          break
        default:
          throw 'Invalid action';
      }

      return stateChain;
    }
  }
}

module.exports = Mascarade;