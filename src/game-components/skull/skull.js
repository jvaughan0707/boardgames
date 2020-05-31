import React, { Component } from 'reactn';
import './skull.css';
import PlayerTile from './playerTile/playerTile';

class Skull extends Component {
  constructor(props) {
    super(props);
    this.state = { game: props.game }
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
    this.setState({ game })
  }

  render() {
    var minBet = Math.max(...this.props.game.players.map(p => p.state.currentBet), 0) + 1;
    var maxBet = this.props.game.players.reduce((t, p) => t + p.state.playedCards.length, 0);

    var userIndex = this.state.game.players.findIndex(p => p.userId === this.global.user.userId);
    var playerTiles = this.state.game.players.map((p, i) =>
      <PlayerTile key={p.userId}
        game={this.state.game} playerIndex={i}
        playerIsUser={i === userIndex}
        minBet={minBet} maxBet={maxBet}
        sendMove={(type, data) => {
          this.global.webSocket.emit("gameAction", this.props.game.gameId, type, data, error => console.log(error))
        }} />);
    var sortedTiles = [...playerTiles.slice(userIndex), ...playerTiles.slice(0, userIndex)];

    return (
      <>
        <p>Current phase: {this.state.game.state.phase}</p>
        {sortedTiles}
      </>
    )
  }
}

export default Skull