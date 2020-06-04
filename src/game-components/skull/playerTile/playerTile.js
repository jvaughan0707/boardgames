import React, { Component } from 'reactn';
import './playerTile.css';
const images = require.context('../../../resources/skull', true);

class PlayerTile extends Component {
  renderCard(card) {
    var frontCard = null;
    if (card.value === 'skull') {
      frontCard = images('./' + card.colour + '_skull.png');
    } else if (card.value === 'flower') {
      frontCard = images('./' + card.colour + '_flower.png');
    }
    var backCard = images('./' + card.colour + '_back.png');
    var className = `card ${card.faceUp ? '' : 'flipped'} ${card.click ? 'clickable' : ''}  ${this.props.animate ? 'animated' : ''}`;
    return (
      <div key={card.id} onClick={card.click} className={className}
        style={card.style}>
        <div className='card-inner'>
          {frontCard &&
            <div className="card-front">
              <img src={frontCard} alt="card front" />
            </div>
          }
          <div className="card-back">
            <img src={backCard} alt="card back" />
          </div>
        </div>
      </div>
    )
  }

  render() {
    var game = this.props.game;
    var player = this.props.player;
    var user = this.props.user;
    var colour = player.state.colour;
    var baseImg = images('./' + colour + '_base.png');
    var playingPhase = game.state.phase === "playing";
    var revealingPhase = game.state.phase === "revealing";
    return (
      <div className={`player-tile ${this.props.playerIsUser ? 'primary' : ''}`} style={this.props.style}>
        <div className="player-tile-inner">
          <h3>{player.displayName}</h3>
          {/* {player.state.currentTurn && "*"} | Current Bet: {player.state.currentBet} | Current Score: {player.state.score} */}
          <img src={baseImg} alt="base" className="base-card"></img>
          {
            //Needs to be one JSX expression so that CSS animations work
            [
              ...player.state.hand.map((card, index) => ({
                ...card,
                colour,
                faceUp: this.props.playerIsUser,
                click: playingPhase && this.props.playerIsUser && player.state.currentTurn ? () => this.props.sendMove("playCard", card.id) : null,
                style: { transform: this.props.playerIsUser ? `translate(${10 + index * 105}%, 120%)` : `translate(${10 + index * 15}%, 10%)`, zIndex: 12 - index }
              })),
              ...player.state.playedCards.map((card, index) => ({
                ...card,
                colour,
                faceUp: false,
                click: revealingPhase && user.state.currentTurn && (this.props.playerIsUser || user.state.playedCards.length === 0) ? () => this.props.sendMove("revealCard", player.userId) : null,
                style: { transform: `translate(168%, ${17 - index * 15}%) rotateX(45deg)`, zIndex: 5 + index, filter: 'drop-shadow(0px 5px 0px #222)' }
              })),
              ...player.state.revealedCards.map((card, index) => ({
                ...card,
                colour,
                faceUp: true,
                click: null,
                style: { transform: `translate(${280 + index * 15}%, 10%)`, zIndex: index }
              }))
            ].sort((a, b) => a.id - b.id)
              .map(card => this.renderCard(card))
          }          
        </div>
      </div>
    );
  }
}

export default PlayerTile