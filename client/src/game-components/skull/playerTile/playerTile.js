import React, { Component } from 'reactn';
import Tile from '../../common/tile/tile'
import './playerTile.css';
const images = require.context('../../../resources/skull', true);

class PlayerTile extends Component {
  componentDidMount() {
    this.colour = this.props.player.state.colour;
    var cardSet = images('./' + this.colour + '.png');
    
    var getBackground = index => {
      return `url(${cardSet}) 
        ${index * 25 + 0.25/(index+1)}% 0px /542% no-repeat`;
    }

    this.cardBack = getBackground(0);
    this.flower = getBackground(1);
    this.skull = getBackground(2);
    this.baseFront = getBackground(3);
    this.baseBack = getBackground(4);

    switch (this.colour) {
      case 'gold':
        this.tileColour = '#a37131'
        break;
      case 'red':
        this.tileColour = '#944245';
        break;
      case 'blue':
        this.tileColour = '#173753';
        break;
      case 'purple':
        this.tileColour = '#c56ff1'
        break;
      case 'green':
        this.tileColour = '#135418';
        break;
      case 'pink':
        this.tileColour = '#bd0202'
        break;
      default: this.tileColour = '#222';
        break;
    }
  }

  render() {
    var game = this.global.game;
    var player = this.props.player;
    var user = this.props.user;

    var playingPhase = game.state.phase === "playing";
    var bettingPhase = game.state.phase === "betting";
    var revealingPhase = game.state.phase === "revealing";
    var className = `player-tile ${this.props.playerIsUser ? 'primary' : ''} ${player.state.currentTurn ? 'current-turn' : ''} ${player.active ? '' : 'inactive'}`
    return (
      <div className={className} style={this.props.style}>
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
          <Tile frontImg={this.baseFront}
            backImg={this.baseBack}
            colour={player.state.score === 1 ? this.tileColour : '#222'}
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
                  colour={this.tileColour}
                  frontImg={this.getCardBackground(card)}
                  backImg={this.cardBack}
                  click={playingPhase && this.props.playerIsUser && player.state.currentTurn ? () => this.props.sendMove("playCard", card.id) : null}
                  className='card'
                  animated={this.props.animate}
                  posX={this.props.playerIsUser ? 10 + index * 112 : 5 + index * 20}
                  posY={this.props.playerIsUser ? 110 : 5}
                  rotateY={this.props.playerIsUser ? 0 : -180}
                  zIndex={12 - index} />
              ),
              ...player.state.playedCards.map((card, index) =>
                <Tile key={card.id}
                  colour={this.tileColour}
                  frontImg={this.getCardBackground(card)}
                  backImg={this.cardBack}
                  click={revealingPhase && user.state.currentTurn && (this.props.playerIsUser || user.state.playedCards.length === 0) ? () => this.props.sendMove("revealCard", player.userId) : null}
                  posX={this.props.playerIsUser ? 177 : 195}
                  posY={2 - index * 7}
                  rotateX={55}
                  rotateY={-180}
                  zIndex={5 + index}
                  animated={this.props.animate}
                  className="card" />
              ),
              ...player.state.revealedCards.map((card, index) =>
                <Tile key={card.id}
                  colour={this.tileColour}
                  frontImg={this.getCardBackground(card)}
                  backImg={this.cardBack}
                  className="card"
                  animated={this.props.animate}
                  posX={330}
                  posY={15 - index * 7}
                  rotateX={55}
                  zIndex={index} />
              )
            ].sort((a, b) => a.key - b.key)
          }
        </div>
      </div>
    );
  } 

  getCardBackground(card) {
    if (card.value === 'skull') {
      return this.skull;
    } else if (card.value === 'flower') {
      return this.flower;
    }
    return null;
  }
}

export default PlayerTile