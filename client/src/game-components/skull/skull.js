import React, { Component } from 'reactn';
import './skull.scss';
import PlayerTile from './playerTile/playerTile';
import Finish from './finish/finish';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class Skull extends Component {
  constructor(props) {
    super(props);
    this.state = { betAmount: this.getMinBet(), dimensions: null }
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
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

  componentDidUpdate() {
    var max = this.getMaxBet();
    var min = this.getMinBet(); 
    if (max < this.state.betAmount || this.state.betAmount < min) {
      this.setState({ betAmount: Math.min(Math.max(this.state.betAmount, min), max) });
    }
  }

  getMinBet() {
    var game = this.global.game;
    return Math.min(Math.max(...game.players.map(p => p.state.currentBet), 0) + 1, this.getMaxBet());
  }

  getMaxBet() {
    var game = this.global.game;
    return Math.max(game.players.reduce((t, p) => t + p.state.playedCards.length + p.state.revealedCards.length, 0), 1)
  }

  getTilePosition(i) {
    var playerCount = this.global.game.players.length;
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
    if (this.props.allowAction) {
      this.global.webSocket.emit("gameAction", this.global.game.gameId, type, data, error => console.log(error));
    }
  }

  increaseBet = () =>
    this.setState({ betAmount: this.state.betAmount + 1 })

  decreaseBet = () =>
    this.setState({ betAmount: this.state.betAmount - 1 })

  render() {
    var game = this.global.game;
    var playingPhase = game.state.phase === "playing";
    var bettingPhase = game.state.phase === "betting";
    var revealingPhase = game.state.phase === "revealing";
    var cleanUp = game.state.phase === "cleanUp";

    var players = game.players;
    var maxBet = Math.max(this.getMaxBet(), 1);
    var minBet = Math.min(this.getMinBet(), maxBet);
    var userIndex = players.findIndex(p => p.userId === this.global.user.userId);
    var user = players[userIndex];
    var currentTurnPlayer = players.find(p => p.state.currentTurn);
    players = [...players.slice(userIndex), ...players.slice(0, userIndex)];

    var canBet = user.state.currentTurn && user.state.playedCards.length > 0 && (playingPhase || bettingPhase);

    var actionText = user.state.currentTurn ? 'You' : currentTurnPlayer.displayName;
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

    return (
      <>
        {
          game.finished &&
          <Finish />
        }
        <div id="skull-container" ref={el => (this.container = el)}>
          <div className="panel left">
            <div id="controls" className="centered">
              <button onClick={() => this.sendMove("bet", this.state.betAmount)} disabled={!canBet}>
                Bet
              </button>
              <button className="small" onClick={this.decreaseBet} disabled={!canBet || this.state.betAmount <= minBet}>
                <FontAwesomeIcon icon="minus" />
              </button>
              <div id="betAmount">
                {this.state.betAmount}
              </div>
              <button className="small" onClick={this.increaseBet} disabled={!canBet || this.state.betAmount >= maxBet} >
                <FontAwesomeIcon icon="plus" />
              </button>
              <br />
              <button disabled={!user.state.currentTurn || !bettingPhase}
                onClick={() => this.sendMove("pass", null)}>Pass
            </button>
            </div>
          </div>
          <div className="panel right">
            <div id="actionText">
              {actionText}
            </div>
          </div>
          {
            players.map((p, i) =>
              <PlayerTile
                style={{ transform: this.getTilePosition(i) }}
                key={p.userId}
                player={p}
                user={user}
                playerIsUser={i === 0}
                sendMove={this.sendMove}
                animate={this.props.animate} />)
          }
        </div>
      </>
    )
  }
}

export default Skull