import React, { Component } from 'reactn';
import Skull from '../../game-components/skull/skull';
import Spyfall from '../../game-components/spyfall/spyfall';
import Mascarade from '../../game-components/mascarade/mascarade';

class Play extends Component {
  constructor() {
    super();
    this.state = { animate: true, updating: false, stateChain: [] }
  }

  getGameComponent(game) {
    switch (game.type.toLowerCase()) {
      case 'skull':
        return <Skull animate={this.state.animate} allowAction={!this.state.updating && this.global.webSocket.connected} />
      case 'spyfall':
        return <Spyfall animate={this.state.animate} allowAction={!this.state.updating && this.global.webSocket.connected} />
      case 'mascarade':
        return <Mascarade animate={this.state.animate} allowAction={!this.state.updating && this.global.webSocket.connected} />
      default:
        break;
    }
  }

  componentDidMount() {
    const ws = this.global.webSocket;
    ws.on('gameAction', this.onGameAction.bind(this));
  }

  componentWillUnmount() {
    const ws = this.global.webSocket;
    ws.off('gameAction', this.onGameAction.bind(this));
  }

  onGameAction(stateChain) {
    this.state.stateChain = [...this.state.stateChain, ...stateChain];
    
    if (!this.state.updating) {
      this.update();
    }
  }
  
  update = () => {
    var stateChain = this.state.stateChain;
    if (stateChain.length > 0) {
      let { game, animate, pause } = stateChain.shift();
      if (game) {
        this.setState({ updating: true, animate, stateChain });
        this.setGlobal({ game });
        if (stateChain.length > 0) {
          this.timeout = setTimeout(
            () => {
              this.update();
            },
            (pause || 0) + (animate ? 1000 : 100)
          );
        }
        else {
          this.setState({ updating: false });
        }
      }
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