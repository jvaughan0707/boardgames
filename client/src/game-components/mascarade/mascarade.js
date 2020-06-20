import React, { Component } from 'reactn';
import './mascarade.css';
import Finish from './finish/finish';
import Tile from '../common/tile/tile'

class Mascarade extends Component {
  constructor(props) {
    super(props);
    this.state = { updating: false, selectedLocationId: null }
  }

  sendMove = (type, data) => {
    if (!this.state.updating) {
      this.global.webSocket.emit("gameAction", this.global.game.gameId, type, data, error => console.log(error));
    }
  }

  render() {
    var game = this.global.game;
    var players = game.players;
    var userIndex = players.findIndex(p => p.userId === this.global.user.userId);
    var user = players[userIndex];
    var currentTurnPlayer = players[game.state.currentTurnPlayer];
    players = [...players.slice(userIndex), ...players.slice(0, userIndex)];

    return (
      <>
        {
          game.finished &&
          <Finish />
        }
        <div id="mascarade-container">
          {
            players.map((p, index) => 
              <Tile key={p.userId}
              frontImg={null}
              backImg={null}
              click={null}
              className="card"
              animated={this.props.animate}
              posX={this.props.playerIsUser ? 10 + index * 112 : 5 + index * 20}
              posY={this.props.playerIsUser ? 110 : 5}
              rotateY={p.state.card.revealed ? 0 : -180}
              zIndex={0} />)
          }
        </div>
      </>
    )
  }
}

export default Mascarade