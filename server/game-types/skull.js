const _ = require('lodash');
const phases = { playing: 'playing', betting: 'betting', revealing: 'revealing', cleanUp: 'cleanUp' };

class SkullService {
  constructor(game) {
    var stateChain = [];

    var addCheckpoint = (animate, pause) => stateChain.push({ game: game.toObject(), animate, pause })

    var setNextTurnPlayer = (currentPlayer) => {
      currentPlayer.state.public.currentTurn = false;
      var turn = currentPlayer.__index;

      for (var i = 0; i < game.players.length; i++) {
        turn++;
        turn %= game.players.length;
        let player = game.players[turn];

        if (player.state.public.isAlive && !player.state.public.passed) {
          player.state.public.currentTurn = true;
          return;
        }
      }
    }

    var reset = () => {
      game.players.forEach(player => {
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
      });

      addCheckpoint(true);

      game.players.forEach(player => {
        if (player.state.public.isAlive) {
          player.state.public.hand = player.state.public.hand.map((c, i) => ({ id: i }));

          var shuffled = _.shuffle(player.state.public.hand);
          player.state.private.hand.forEach((card, index) => card.id = shuffled[index].id);
        }
      });
      addCheckpoint(false);
    }

    this.getLobbySettings = () =>
      ({ type: 'skull', title: 'Skull', minPlayers: 2, maxPlayers: 12, players: [] });

    this.initializeGame = () => {
      const colours = ["gold", "blue", "red", "pink", "green", "purple"];
      const playerCount = game.players.length;
      game.state = { public: { phase: phases.playing }, internal: {} };

      game.players.forEach((p, i) => {
        if (i < 6) {
          var colour = colours[i];
        }
        else {
          var colour = colours[i - Math.ceil((playerCount) / 2)];
        }

        var skullIndex = Math.floor(Math.random() * 4);
        var cards = new Array(4).fill(null).map((x, i) => ({ id: i, value: i == skullIndex ? 'skull' : 'flower' }));
        var publicCards = cards.map(c => ({ id: c.id }));
        p.state.public = { currentTurn: i == 0, score: 0, colour, hand: publicCards, playedCards: [], revealedCards: [], currentBet: 0, passed: false, isAlive: true };
        p.state.private = { hand: cards };
        p.state.internal = { playedCards: [] }
      });
    }

    this.onPlayerQuit = (userId) => {
      var currentPlayer = game.players.find(p => p.userId == userId);
      currentPlayer.state.public.isAlive = false;
      currentPlayer.state.public.currentBet = 0;

      var remainingPlayers = game.players.filter(p => p.state.public.isAlive)
      if (remainingPlayers.length == 1) {
        game.finished = true;
        var winner = remainingPlayers[0];
        game.state.public.winner = { displayName: winner.displayName, userId: winner.userId };
      }
      else {
        if (game.state.public.phase == phases.betting) {
          if (game.players.filter(p => p.state.public.isAlive && !p.state.public.passed).length == 1) {
            game.state.pubic.phase = phases.revealing;
          }
        }
        else if (game.state.public.phase == phases.revealing) {
          if (currentPlayer.state.public.currentTurn) {
            game.state.public.phase = phases.cleanUp;
            reset();
            game.state.public.phase = phases.playing;
          }
        }

        if (currentPlayer.state.public.currentTurn) {
          setNextTurnPlayer(currentPlayer);
        }
      }

      addCheckpoint(false);

      return stateChain;
    }

    this.validateAction = (currentPlayer, action, data, onError) => {
      if (!currentPlayer.state.public.currentTurn) {
        onError('Its not your turn');
        return;
      }

      switch (action) {
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

          setNextTurnPlayer(currentPlayer);

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
              if (p !== currentPlayer && p.state.public.isAlive) {
                p.state.public.passed = true;
              }
            })
            addCheckpoint(false, 2000);

            game.state.public.phase = phases.revealing;
          }
          else {
            setNextTurnPlayer(currentPlayer);
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

          var remainingPlayersCount = game.players.filter(p => p.state.public.isAlive && !p.state.public.passed).length;

          if (remainingPlayersCount == 1) {
            onError('You cannot pass as the final player')
            return;
          }

          if (remainingPlayersCount == 2) {
            game.state.public.phase = phases.revealing;
            
          }

          setNextTurnPlayer(currentPlayer);
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
              currentPlayer.state.public.isAlive = false;
              var remainingPlayers = game.players.filter(p => p.state.public.isAlive)

              if (remainingPlayers.length == 1) {
                game.finished = true;
                var winner = remainingPlayers[0];
                game.state.public.winner = { displayName: winner.displayName, userId: winner.userId };
              }
              else {
                setNextTurnPlayer(currentPlayer);
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
                currentPlayer.state.public.score++;
                game.finished = true;
                var winner = currentPlayer;
                game.state.public.winner = { displayName: winner.displayName, userId: winner.userId };
              }
              else {
                game.state.public.phase = phases.cleanUp;
                reset();
                currentPlayer.state.public.score++;
                addCheckpoint(true);
                game.state.public.phase = phases.playing;
              }
            }
          }

          addCheckpoint(false);
          break;
        default:
          throw 'Invalid action';
      }

      return stateChain;
    }
  }
}

module.exports = SkullService;