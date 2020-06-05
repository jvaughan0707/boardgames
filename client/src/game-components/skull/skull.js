import React, { Component } from 'reactn';
import './skull.css';
import PlayerTile from './playerTile/playerTile';

class Skull extends Component {
  constructor(props) {
    super(props);
    this.state = { game: props.game, animate: props.animate, updating: false, betAmount: 0 }
  }

  componentDidMount() {
    const ws = this.global.webSocket;
    ws.on('gameAction', this.onGameAction.bind(this));
  }

  componentWillUnmount() {
    const ws = this.global.webSocket;
    ws.off('gameAction', this.onGameAction.bind(this));
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
      let { game, animate } = stateChain.shift();
      if (game) {
        this.setState({ updating: true, game, animate: animate && this.props.animate });

        if (stateChain.length > 0) {
          setTimeout(() => {
            setNext();
          }, animate ? 1000 : 100)
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
      x = 75;
      y = 3;
    }
    else {
      if (i > playerCount / 2) {
        x = 5
      }
      else if (i < playerCount / 2) {
        x = 145
      }
      else {
        x = 75;
      }
      y = 200 + (playerCount / 2 - Math.abs(playerCount / 2 - i) - 1) * 105;
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
    if (game.finished) {

    }
    else {
      var players = game.players;
      var maxBet = this.getMaxBet(game);
      var minBet = Math.min(this.getMinBet(game), maxBet);
      var userIndex = players.findIndex(p => p.userId === this.global.user.userId);
      var user = players[userIndex];
      players = [...players.slice(userIndex), ...players.slice(0, userIndex)];

      var playingPhase = this.state.game.state.phase === "playing";
      var bettingPhase = game.state.phase === "betting";
      var canBet = user.state.currentTurn && user.state.playedCards.length > 0 && (playingPhase || bettingPhase);

      return (
        <div className="skull-container">
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
          {
            <div className="controls">
              <div>
                <button onClick={() => this.sendMove("bet", this.state.betAmount)} disabled={!canBet}>
                  Bet
              </button>
                <input
                  type="number"
                  min={minBet}
                  max={maxBet}
                  disabled={!canBet}
                  value={Math.max(this.state.betAmount, minBet)}
                  onChange={this.onBetAmountChange}>
                </input>
                <br />
                <button disabled={!user.state.currentTurn || !bettingPhase}
                  onClick={() => this.props.sendMove("pass", null)}>Pass
                </button>
              </div>
            </div>
          }
        </div>
      )
    }
  }
}

export default Skull