import React, { Component } from 'reactn';
import Tile from '../../common/tile/tile'
import './playerTile.css';
const images = require.context('../../../resources/skull', true);

class PlayerTile extends Component {
   render() {
    var game = this.global.game;
    var player = this.props.player;
    var user = this.props.user;
    var colour = player.state.colour;
    var cardBack = images('./' + colour + '_back.png');
    var baseFront = images('./' + colour + '_base_front.png');
    var baseBack = images('./' + colour + '_base_back.png');
    var playingPhase = game.state.phase === "playing";
    var bettingPhase = game.state.phase === "betting";
    var revealingPhase = game.state.phase === "revealing";
    return (
      <div className={`player-tile ${this.props.playerIsUser ? 'primary' : ''} ${player.state.currentTurn ? 'current-turn' : ''}`} 
        style={this.props.style}>
        
        <div className="player-tile-inner">
          <h3>{player.displayName}</h3>
          {
            player.active && bettingPhase &&
            (player.state.currentBet || player.state.passed) &&
            <div className="speech-bubble">
              {player.state.passed ? 'Pass' :
                'I bet ' + player.state.currentBet}
            </div>
          }
          <Tile frontImg={baseFront}
            backImg={baseBack}
            colour={player.state.score === 1 ? this.getTileColour(colour) : '#222'}
            posX={this.props.playerIsUser ? 135 : 150}
            posY={-5}
            rotateX={55}
            rotateY={player.state.score === 1 ? 180 : 0}
            className="base-tile"
            animated={this.props.animate} />
          {
            //Needs to be one JSX expression so that CSS animations work
            [
              ...player.state.hand.map((card, index) =>
                <Tile key={card.id}
                  colour={this.getTileColour(colour)}
                  frontImg={this.getCardImg(card, colour)}
                  backImg={cardBack}
                  click={playingPhase && this.props.playerIsUser && player.state.currentTurn ? () => this.props.sendMove("playCard", card.id) : null}
                  className='card'
                  animated={this.props.animate}
                  posX={this.props.playerIsUser ? 10 + index * 112 : 5 + index * 20}
                  posY={this.props.playerIsUser ? 105 : 5}
                  rotateY={this.props.playerIsUser ? 0 : -180}
                  zIndex={12 - index} />
              ),
              ...player.state.playedCards.map((card, index) =>
                <Tile key={card.id}
                  colour={this.getTileColour(colour)}
                  frontImg={this.getCardImg(card, colour)}
                  backImg={cardBack}
                  click={revealingPhase && user.state.currentTurn && (this.props.playerIsUser || user.state.playedCards.length === 0) ? () => this.props.sendMove("revealCard", player.userId) : null}
                  posX={this.props.playerIsUser ? 177: 195}
                  posY={2 - index * 7}
                  rotateX={55}
                  rotateY={-180}
                  zIndex={5 + index}
                  animated={this.props.animate}
                  className="card" />
              ),
              ...player.state.revealedCards.map((card, index) =>
                <Tile key={card.id}
                  colour={this.getTileColour(colour)}
                  frontImg={this.getCardImg(card, colour)}
                  backImg={cardBack}
                  className="card"
                  animated={this.props.animate}
                  posX={330}
                  posY={15 - index * 7}
                  rotateX={55}
                  zIndex={index }/>
              )
            ].sort((a, b) => a.key - b.key)
          }
        </div>
      </div>
    );
  }

  getCardImg(card, colour) {
    var img = null;
    if (card.value === 'skull') {
      img = images('./' + colour + '_skull.png');
    } else if (card.value === 'flower') {
      img = images('./' + colour + '_flower.png');
    }
    return img;
  }

  getTileColour(playerColour) {
    switch (playerColour) {
      case 'gold': return '#a37131';
      case 'red': return '#944245';
      case 'blue': return '#173753';
      case 'purple': return '#c56ff1'
      case 'green': return '#135418';
      case 'pink': return '#bd0202'
      default: return '#222';
    }
  }
}

export default PlayerTile