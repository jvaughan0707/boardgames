const Lobby = require('../models/lobby');
const _ = require('lodash');
const phases = { playing: 'playing', betting: 'betting', revealing: 'revealing', cleanUp: 'cleanUp' };

class SkullService {
  static createLobby() {
    return new Lobby({ type: 'skull', title: 'Skull', minPlayers: 2, maxPlayers: 6, players: [] })
  }

  static initializeGame(game) {
    const colours = ["gold", "blue", "red", "pink", "green", "purple"];

    game.state = { public: { phase: phases.playing }, internal: {} };

    game.players.forEach((p, i) => {
      var skullIndex = Math.floor(Math.random() * 4);
      var cards = new Array(4).fill(null).map((x, i) => ({ id: i, value: i == skullIndex ? 'skull' : 'flower' }));
      var publicCards = cards.map(c => ({ id: c.id }));
      p.state.public = { currentTurn: i == 0, score: 0, colour: colours[i], hand: publicCards, playedCards: [], revealedCards: [], currentBet: 0, passed: false };
      p.state.private = { hand: cards };
      p.state.internal = { playedCards: [] }
    });
  }

  static onPlayerQuit(game, userId) {

  }

  static validateAction(currentPlayer, game, type, data, onSuccess, onError) {
    if (!currentPlayer.state.public.currentTurn) {
      onError('Its not your turn');
      return;
    }
    var stateChain = [];

    var setNextTurnPlayer = () => {
      currentPlayer.state.public.currentTurn = false;
      var turn = currentPlayer.__index;

      for (var i = 0; i < game.players.length; i++) {
        turn++;
        turn %= game.players.length;
        let player = game.players[turn];

        if (player.active && !player.passed) {
          player.state.public.currentTurn = true;
          return;
        }
      }
    }

    var addCheckpoint = (animate, pause) => stateChain.push({ game: game.toObject(), animate, pause })

    var reset = () => {
      game.players.forEach(player => {
        if (player.active) {

          // Revealed cards will stay revealed temporarily until they have moved back to the players hand
          var publicHand = [
            ...player.state.public.hand,
            ...player.state.public.playedCards,
            ...player.state.public.revealedCards
          ];

          var privateHand = [
            ...player.state.private.hand,
            ...player.state.internal.playedCards,
            ...player.state.public.revealedCards
          ];

          player.state.public = { ...player.state.public, hand: publicHand, playedCards: [], revealedCards: [], currentBet: 0, passed: false };
          player.state.internal.playedCards = [];
          player.state.private.hand = privateHand;
        }
      });

      addCheckpoint(true);

      game.players.forEach(player => {
        if (player.active) {
          player.state.public.hand = player.state.public.hand.map((c, i) => ({ id: i }));

          var shuffled = _.shuffle(player.state.public.hand);
          player.state.private.hand.forEach((card, index) => card.id = shuffled[index].id);
        }
      });
      addCheckpoint(false);
    }

    switch (type) {
      case "playCard":
        if (game.state.public.phase !== phases.playing) {
          onError('You cannot play cards at this time')
          return;
        }

        var cardIndex = currentPlayer.state.private.hand.findIndex(c => c.id == data);

        if (cardIndex < 0) {
          onError('Specified card not found')
          return;
        }

        setNextTurnPlayer();

        var card = currentPlayer.state.private.hand[cardIndex];
        currentPlayer.state.private.hand.splice(cardIndex, 1);
        currentPlayer.state.internal.playedCards.push(card);

        // The player needs to be able to see the card until it is played so add it temporarily
        // to their private state without saving it
        currentPlayer.state.private.playedCards = currentPlayer.state.public.playedCards.slice();
        currentPlayer.state.private.playedCards.push(card);

        currentPlayer.state.public.hand = currentPlayer.state.public.hand.filter(c => c.id !== card.id);
        currentPlayer.state.public.playedCards.push({ id: card.id });
        addCheckpoint(true);
        delete currentPlayer.state.private.playedCards;

        addCheckpoint(false);
        break;
      case "bet":
        if (game.state.public.phase === phases.playing) {
          if (currentPlayer.state.public.playedCards.length > 0) {
            game.state.public.phase = phases.betting;
          }
          else {
            onError('You must play a card before betting')
            return;
          }
        }
        else if (game.state.public.phase !== phases.betting) {
          onError('Cannot bet at this time');
          return;
        }

        if (currentPlayer.state.public.passed) {
          onError('You have already passed for this round')
          return;
        }

        var bet = Number(data)
        var highestBet = Math.max(...game.players.map(p => p.state.public.currentBet));

        if (bet <= highestBet) {
          onError('Bet must be higher than the current highest bid (' + highestBet + ')')
          return;
        }

        var totalPlayed = game.players.reduce((t, p) => t + p.state.public.playedCards.length, 0);

        if (bet > totalPlayed) {
          onError('Bet cannot be higher than the total number of played cards (' + totalPlayed + ')')
          return;
        }

        currentPlayer.state.public.currentBet = bet;

        if (bet == totalPlayed) {
          game.players.forEach(p => {
            if (p !== currentPlayer) {
              p.state.public.passed = true;
            }
          })
          addCheckpoint(false, 2000);

          game.state.public.phase = phases.revealing;
        }
        else {
          setNextTurnPlayer();
        }

        addCheckpoint(false);

        break;
      case "pass":
        if (game.state.public.phase !== phases.betting) {
          onError('Cannot pass at this time');
          return;
        }

        if (currentPlayer.state.public.passed) {
          onError('You have already passed for this round')
          return;
        }

        var remainingPlayersCount = game.players.filter(p => p.active && !p.state.public.passed).length;

        if (remainingPlayersCount == 1) {
          onError('You cannot pass as the final player')
          return;
        }

        if (remainingPlayersCount == 2) {
          game.state.public.phase = phases.revealing;
        }

        setNextTurnPlayer();
        currentPlayer.state.public.passed = true;

        addCheckpoint(false);
        break;
      case "revealCard":
        if (game.state.public.phase !== phases.revealing) {
          onError('Cannot reveal at this time');
          return;
        }

        if (currentPlayer.passed) {
          onError('You have already passed for this round');
          return;
        }

        var userId = data;

        if (currentPlayer.userId !== userId) {
          if (currentPlayer.state.public.playedCards.length > 0) {
            onError('You must reveal all of your own cards first');
            return;
          }

          var targetPlayer = game.players.find(p => p.userId == userId);

          if (!targetPlayer) {
            onError('Selected user not found');
            return;
          }
        }
        else {
          var targetPlayer = currentPlayer;
        }

        var card = targetPlayer.state.internal.playedCards.pop();

        if (!card) {
          onError('Target player has no cards left');
          return;
        }

        targetPlayer.state.public.playedCards.pop();
        targetPlayer.state.public.revealedCards.push(card);

        addCheckpoint(true);

        if (card.value === 'skull') {
          addCheckpoint(false, 2000);
          game.state.public.phase = phases.cleanUp;
          reset();

          let index = Math.floor(Math.random() * currentPlayer.state.private.hand.length);
          let id = currentPlayer.state.private.hand[index].id;
          currentPlayer.state.private.hand.splice(index, 1);
          currentPlayer.state.public.hand = currentPlayer.state.public.hand.filter(c => c.id !== id);

          if (currentPlayer.state.public.hand.length == 0) {
            currentPlayer.active = false;
            var activePlayers = game.players.filter(p => p.active)

            if (activePlayers.length == 1) {
              game.finished = true;
              game.players[0].currentTurn = true;
            }
            else {
              setNextTurnPlayer();
            }
          }

          addCheckpoint(true);
          game.state.public.phase = phases.playing;
        }
        else {
          let totalRevealed = game.players.reduce((t, p) => t + p.state.public.revealedCards.length, 0);

          if (totalRevealed == currentPlayer.state.public.currentBet) {
            addCheckpoint(false, 2000);

            if (currentPlayer.state.public.score == 1) {
              game.players.forEach(p => {
                if (p !== currentPlayer) {
                  p.active = false;
                }
              })
              game.finished = true;
            }
            else {
              game.state.public.phase = phases.cleanUp;
              reset();
              currentPlayer.state.public.score++;
              game.state.public.phase = phases.playing;
            }
          }
        }

        addCheckpoint(false);
        break;
      default:
        return;
    }
    onSuccess(stateChain);
  }
}

module.exports = SkullService;