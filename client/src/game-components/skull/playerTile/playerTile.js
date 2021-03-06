import React, { Component } from 'reactn';
import Tile from '../../common/tile/tile'
import './playerTile.scss';

class PlayerTile extends Component {
  componentDidMount() {
    this.colour = this.props.player.state.colour;

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
          <Tile frontImgClass={'base-front'}
            backImgClass={'base-back'}
            colour={player.state.score === 1 ? this.tileColour : '#222'}
            posX={40.5}
            posY={-2}
            rotateX={55}
            rotateY={player.state.score === 1 ? 180 : 0}
            className={`base-tile ${player.state.colour}`}
            animated={this.props.animate} />
          {
            //Needs to be one JSX expression so that CSS animations work
            [
              ...player.state.hand.map((card, index) =>
                <Tile key={card.id}
                  colour={this.tileColour}
                  frontImgClass={card.value || 'card-back'}
                  backImgClass={'card-back'}
                  click={playingPhase && this.props.playerIsUser && player.state.currentTurn ? () => this.props.sendMove("playCard", card.id) : null}
                  className={`card ${player.state.colour}`}
                  animated={this.props.animate}
                  posX={this.props.playerIsUser ? 1.5 + index * 25 : 1 + index * 5}
                  posY={this.props.playerIsUser ? 50 : 5}
                  rotateY={this.props.playerIsUser ? 0 : -180}
                  zIndex={12 - index} />
              ),
              ...player.state.playedCards.map((card, index) =>
                <Tile key={card.id}
                  colour={this.tileColour}
                  frontImgClass={card.value || 'card-back'}
                  backImgClass={'card-back'}
                  click={revealingPhase && user.state.currentTurn && (this.props.playerIsUser || user.state.playedCards.length === 0) ? () => this.props.sendMove("revealCard", player.userId) : null}
                  posX={43}
                  posY={this.props.playerIsUser ? 2 - index * 3 : 5 - index * 6}
                  rotateX={55}
                  rotateY={-180}
                  zIndex={5 + index}
                  animated={this.props.animate}
                  className={`card ${player.state.colour}`} />
              ),
              ...player.state.revealedCards.map((card, index) =>
                <Tile key={card.id}
                  colour={this.tileColour}
                  frontImgClass={card.value || 'card-back'}
                  backImgClass={'card-back'}
                  className={`card ${player.state.colour}`}
                  animated={this.props.animate}
                  posX={74}
                  posY={this.props.playerIsUser ? 7 - index * 3 : 14 - index * 6}
                  rotateX={55}
                  zIndex={index} />
              )
            ].sort((a, b) => a.key - b.key)
          }
        </div>
      </div>
    );
  } 
}

export default PlayerTile