import React, { Component } from 'reactn';
import './skull.css';
const images = require.context('../../resources/skull', true);

class Skull extends Component {
  constructor(props) {
    super(props);
    var minBet = Math.max(...props.game.players.map(p => p.state.currentBet), 0) + 1;
    var maxBet = props.game.players.reduce((t, p) => t + p.state.playedCards.length, 0);

    this.state = { game: props.game, betAmount: minBet, minBet, maxBet }
  }

  componentDidMount() {
    const ws = this.global.webSocket;
    ws.on('gameAction', this.onGameAction.bind(this));
  }

  componentWillUnmount() {
    const ws = this.global.webSocket;
    ws.off('gameAction', this.onGameAction.bind(this));
  }

  onGameAction(type, data, userId, game) {
    switch (type) {
      case 'cardPlayed':
        console.log(userId + ' played card');
        setTimeout(() => {
          this.setState({ game, maxBet: this.state.maxBet + 1 });
        }, 1000);
        break;
      case 'bet':
        console.log(userId + ' placed bet: ' + data)
        setTimeout(() => {
          this.setState({ game, minBet: data + 1, betAmount: Math.max(this.state.betAmount, data + 1) });
        }, 1000);
        break;
      case 'pass':
        console.log(userId + ' passed')
        setTimeout(() => {
          this.setState({ game });
        }, 1000);
        break;
      case 'revealCard':
        console.log(userId + ' revealed card ' + data.card + ' from ' + data.userId)
        setTimeout(() => {
          this.setState({ game });
        }, 1000);
        break;
      default:
        break;
    }
  }

  user = this.global.user;

  getPlayerTile(player, currentTurn, playerIsCurrentUser) {
    var colour = player.state.colour;
    var baseImg = images('./' + colour + '_base.png');
    var playingPhase = this.state.game.state.phase === "playing";
    var bettingPhase = this.state.game.state.phase === "betting";
    var revealingPhase = this.state.game.state.phase === "revealing";

    return (
      <div key={player.userId}>
        <h3>{player.displayName}{currentTurn && "*"}</h3>
        <img src={baseImg} alt="base"></img>
        <p>Current Bet: {player.state.currentBet}</p>
        <p>Hand: </p>
        <div style={{ display: 'flex' }}>
          {
            player.state.hand.map((card, index) =>
              this.getCard(card, colour, index, playerIsCurrentUser, playingPhase && playerIsCurrentUser && currentTurn ? () => this.playCard(index) : null))
          }
        </div>
        <p>Played Cards: </p>
        <div style={{ display: 'flex' }}>
          {
            player.state.playedCards.map((card, index) =>
              this.getCard({}, colour, index, false))
          }
        </div>
        <p>Revealed Cards: </p>
        <div style={{ display: 'flex' }}>
          {
            player.state.revealedCards.map((card, index) =>
              this.getCard(card, colour, index, true))
          }
        </div>
        {
          playerIsCurrentUser &&
          <>
            <p>Controls:</p>
            <div>
              <input type="number" min={this.state.minBet} max={this.state.maxBet} value={this.state.betAmount} onChange={this.onBetAmountChange.bind(this)}></input>
              <button onClick={() => this.placeBet(this.state.betAmount)} disabled={!currentTurn || player.state.playedCards.length === 0 || !(playingPhase || bettingPhase)}>
                {playingPhase ? 'Start Betting' : 'Raise Bet'}
              </button>
              <button disabled={!currentTurn || !bettingPhase}
                onClick={this.pass.bind(this)}>Pass
              </button>
            </div>
          </>
        }

      </div>
    );
  }

  getCard(card, colour, cardIndex, visible, click) {
    var skullCard = images('./' + colour + '_skull.png');
    var flowerCard = images('./' + colour + '_flower.png');
    var backCard = images('./' + colour + '_back.png');
    return (
      <div key={cardIndex} onClick={click}>
        <img src={
          visible ?
            card.skull ?
              skullCard :
              flowerCard :
            backCard
        } className="card" alt="card"></img>
      </div>
    )
  }

  onBetAmountChange(event) {
    this.setState({ betAmount: event.target.value });
  }

  playCard(index) {
    var ws = this.global.webSocket;
    ws.emit("gameAction", this.state.game.gameId, "cardPlayed", index, error => console.log(error));
  }

  placeBet(value) {
    var ws = this.global.webSocket;
    ws.emit("gameAction", this.state.game.gameId, "bet", value, error => console.log(error));
  }

  pass() {
    var ws = this.global.webSocket;
    ws.emit("gameAction", this.state.game.gameId, "pass", error => console.log(error));
  }

  revealCard(userId) {
    var ws = this.global.webSocket;
    ws.emit("gameAction", this.state.game.gameId, "pass", error => console.log(error));
  }

  render() {
    var currentTurnPlayer = this.state.game.players[this.state.game.state.currentTurnPlayer];
    var userIndex = this.state.game.players.findIndex(p => p.userId === this.global.user.userId);
    var userPlayer = this.state.game.players[userIndex];

    var players = [...this.state.game.players.slice(userIndex), ...this.state.game.players.slice(0, userIndex)]
    return (
      <>
        <p>Current phase: {this.state.game.state.phase}</p>
        <p>Players</p>
        {
          players.map((p, i) => this.getPlayerTile(p, p === currentTurnPlayer, p === userPlayer))
        }
      </>
    )
  }
}


export default Skull