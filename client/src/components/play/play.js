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

  render() {
    var game = this.global.game;
    return (
      <>
        {this.getGameComponent(game)}
      </>
    )
  }
}

export default Play