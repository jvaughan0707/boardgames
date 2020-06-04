import React, { Component } from 'reactn';
import Skull from '../../game-components/skull/skull';

class Play extends Component {

  getGameComponent(game) {
    switch (game.type.toLowerCase()) {
      case 'skull':
        return <Skull game={game} animate={true}/>
      default:
        break;
    }
  }

  quit() {
    //prompt are you sure?
    const ws = this.global.webSocket;
    ws.emit('quit', this.props.game.gameId);
  }

  render() {
    var game = this.props.game;
    return (
      <>
        {/* <button onClick={this.quit.bind(this)}>Quit</button> */}
        {this.getGameComponent(game)}
      </>
    )
  }
}

export default Play