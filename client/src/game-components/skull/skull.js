import React, { Component } from 'reactn';
import Confetti from 'react-confetti'
import './skull.css';
import PlayerTile from './playerTile/playerTile';

class Skull extends Component {
  constructor(props) {
    super(props);
    this.state = { game: props.game, animate: props.animate, updating: false, betAmount: 0, dimensions: null }
 
  }

  componentDidMount() {
    const ws = this.global.webSocket;
    ws.on('gameAction', this.onGameAction.bind(this));
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    const ws = this.global.webSocket;
    ws.off('gameAction', this.onGameAction.bind(this));
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    this.setState({
      dimensions: {
        width: this.container.clientWidth,
        height: this.container.clientHeight,
      },
    });
  }

  getMinBet(game) {
    return Math.max(...game.players.map(p => p.state.currentBet), 0) + 1;
  }

  getMaxBet(game) {
    return game.players.reduce((t, p) => t + p.state.playedCards.length, 0)
  }

  onGameAction(stateChain) {
    console.log(stateChain.slice());
    var setNext = () => {
      let { game, animate, pause } = stateChain.shift();
      if (game) {
        this.setState({ updating: true, game, animate: animate && this.props.animate });

        if (stateChain.length > 0) {
          setTimeout(() => {
            setNext();
          }, (pause || 0) + (animate ? 1000 : 100))
        }
        else {
          this.setState({ updating: false })
        }
      }
    }
    if (stateChain && stateChain.length > 0) {
      setNext();
    }
  }

  getTilePosition(i) {
    var playerCount = this.state.game.players.length;
    var x = 0;
    var y = 0

    if (i === 0) {
      x = 58;
    }
    else {
      if (i > playerCount / 2) {
        x = 0;
      }
      else if (i < playerCount / 2) {
        x = 117;
      }
      else {
        x = 58;
      }
      y = 193 + (playerCount / 2 - Math.abs(playerCount / 2 - i) - 1) * 105;
    }
    return `translate(${x}%, ${y}%)`;
  }

  sendMove = (type, data) => {
    if (!this.state.updating) {
      this.global.webSocket.emit("gameAction", this.state.game.gameId, type, data, error => console.log(error));
    }
  }

  onBetAmountChange = (event) =>
    this.setState({ betAmount: event.target.value })

  render() {
    var game = this.state.game;
    var players = game.players;
    var maxBet = Math.max(this.getMaxBet(game), 1);
    var minBet = Math.min(this.getMinBet(game), maxBet);
    var userIndex = players.findIndex(p => p.userId === this.global.user.userId);
    var user = players[userIndex];
    var currentTurnPlayer = players.find(p => p.state.currentTurn);
    players = [...players.slice(userIndex), ...players.slice(0, userIndex)];

    var playingPhase = this.state.game.state.phase === "playing";
    var bettingPhase = game.state.phase === "betting";
    var revealingPhase = game.state.phase === "revealing";
    var cleanUp = game.state.phase === "cleanUp";

    var canBet = user.state.currentTurn && user.state.playedCards.length > 0 && (playingPhase || bettingPhase);
    var betAmount = Math.max(this.state.betAmount, minBet);

    var actionText = user.state.currentTurn ? 'You' : currentTurnPlayer.displayName;
    if (game.finished) {
      actionText += ` win${user.state.currentTurn ? '' : 's'} the game!`
    }
    else {
      if (playingPhase) {
        actionText += ' must play a card';
        if (currentTurnPlayer.state.playedCards.length > 0) {
          actionText += ' or place a bet';
        }
      }
      else if (bettingPhase) {
        actionText += ' must raise or pass';
      }
      else if (revealingPhase) {
        if (game.players.some(p => p.state.revealedCards.some(c => c.value === 'skull'))) {
          actionText += user.state.currentTurn ? ' have revealed a skull and lose one of your cards' :
            ' has revealed a skull and loses one of their cards'
        }
        else {
          var remainingCards = currentTurnPlayer.state.currentBet - game.players.reduce((t, p) => t + p.state.revealedCards.length, 0);

          if (remainingCards > 0) {
            actionText += ` must reveal ${remainingCards} more card${remainingCards > 1 ? 's' : ''}`;
          }
          else {
            actionText += user.state.currentTurn ? ' have acheived your bet and score a point'
              : ' has acheived their bet and scores a point'
          }
        }
      }
      else if (cleanUp) {
        actionText = 'Preparing for next round...'
      }
    }

    return (
      <div className="skull-container"  ref={el => (this.container = el)}>
        {
          game.finished && this.state.dimensions &&
          <Confetti width={this.state.dimensions.width} height={this.state.dimensions.height} numberOfPieces={200} recycle={false} />
        }
        {
          players.map((p, i) =>
            <PlayerTile
              style={{ transform: this.getTilePosition(i) }}
              key={p.userId}
              game={this.state.game}
              player={p}
              user={user}
              playerIsUser={i === 0}
              sendMove={this.sendMove}
              animate={this.state.animate}
              updating={this.state.updating} />)
        }
        <div className="panel left">
          <div id="controls">
            <button onClick={() => this.sendMove("bet", betAmount)} disabled={!canBet}>
              Bet
            </button>
            <input
              type="number"
              min={minBet}
              max={maxBet}
              disabled={!canBet}
              value={betAmount}
              onChange={this.onBetAmountChange}>
            </input>
            <br />
            <button disabled={!user.state.currentTurn || !bettingPhase}
              onClick={() => this.sendMove("pass", null)}>Pass
            </button>
          </div>
        </div>
        <div className="panel right">
          <div>
            {actionText}
          </div>
        </div>
      </div>
    )
  }
}

export default Skull