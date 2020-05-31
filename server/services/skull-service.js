const Lobby = require('../models/lobby');

class SkullService {
  static createLobby() {
    return new Lobby({ type: 'skull', title: 'Skull', minPlayers: 2, maxPlayers: 6, players: [] })
  }

  static initializeGame(game) {
    const colours = ["beige", "blue", "red", "pink", "green", "purple"];

    game.state = { public: { phase: "playing" }, internal: {} };

    game.players.forEach((p, i) => {
      var skullIndex = Math.floor(Math.random() * 4);
      var blankCards = [{}, {}, {}, {}]
      var cards = blankCards.map((x, i) => ({ skull: i == skullIndex }));
      p.state.public = { currentTurn: i == 0, score: 0, colour: colours[i], hand: blankCards, playedCards: [], revealedCards: [], currentBet: 0, passed: false };
      p.state.private = { allCards: cards, hand: cards, playedCards: [] };
    });
  }

  static validateAction(currentPlayer, game, type, data, onSuccess, onError) {
    if (!currentPlayer.state.public.currentTurn) {
      onError('Its not your turn');
      return;
    }

    var setNextTurnPlayer = () => {
      currentPlayer.state.public.currentTurn = false;
      for (var i = 0; i < game.players.length; i++) {
        var turn = currentPlayer.__index;
        turn++;
        turn %= game.players.length;
        let player = game.players[turn];

        if (player.active && !player.passed) {
          player.state.public.currentTurn = true;
          return;
        }
      }
    }

    var reset = () => {
      game.players.forEach(player => {
        let cards = player.state.private.allCards;
        let blankCards = cards.map(c => ({}));
        player.state.public = { ...player.state.public, hand: blankCards, playedCards: [], revealedCards: [], currentBet: 0, passed: false };
        player.state.private = { hand: cards, playedCards: [] };
      });
      game.state.public.phase = "playing";
    }

    switch (type) {
      case "playCard":
        if (game.state.public.phase !== "playing") {
          onError('You cannot play cards at this time')
          return;
        }

        var cardIndex = Number(data);
        var card = currentPlayer.state.private.hand[cardIndex];

        if (!card) {
          onError('Specified card not found')
          return;
        }
        setNextTurnPlayer();

        currentPlayer.state.private.hand.splice(cardIndex, 1);
        currentPlayer.state.private.playedCards.push(card);

        currentPlayer.state.public.hand.splice(cardIndex, 1);
        currentPlayer.state.public.playedCards.push({});

        onSuccess();
        return;
      case "bet":
        if (game.state.public.phase === "playing") {
          if (currentPlayer.state.public.playedCards.length > 0) {
            game.state.public.phase = "betting";
          }
          else {
            onError('You must play a card before betting')
            return;
          }
        }
        else if (game.state.public.phase !== "betting") {
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

        setNextTurnPlayer(p => !p.state.public.passed);
        currentPlayer.state.public.currentBet = bet;

        onSuccess();
        return;
      case "pass":
        if (game.state.public.phase !== "betting") {
          onError('Cannot pass at this time');
          return;
        }

        if (currentPlayer.state.public.passed) {
          onError('You have already passed for this round')
          return;
        }

        var remainingPlayersCount = game.players.filter(p => !p.state.public.passed).length;

        if (remainingPlayersCount == 1) {
          onError('You cannot pass as the final player')
          return;
        }

        if (remainingPlayersCount == 2) {
          game.state.public.phase = "revealing";
        }

        setNextTurnPlayer(p => !p.state.public.passed);
        currentPlayer.state.public.passed = true;
        
        onSuccess();
        return;
      case "revealCard":
        if (game.state.public.phase !== "revealing") {
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

        var card = targetPlayer.state.private.playedCards.pop();

        if (!card) {
          onError('Target player has no cards left');
          return;
        }

        targetPlayer.state.public.playedCards.pop();
        targetPlayer.state.public.revealedCards.push(card);

        if (card.skull) {
          let index = Math.floor(Math.random() * currentPlayer.state.private.allCards.length);
          currentPlayer.state.private.allCards.splice(index, 1)
          reset();
        }
        else {
          let totalRevealed = game.players.reduce((t, p) => t + p.state.public.revealedCards.length, 0);

          if (totalRevealed == currentPlayer.state.public.currentBet) {
            currentPlayer.state.public.score++;
            if (currentPlayer.state.public.score == 2) {
              //Game ends
            }
            else {
              reset();
            }
          }
        }

        onSuccess({ userId, card });
        return;
      default:
        return;
    }
  }
}

module.exports = SkullService;