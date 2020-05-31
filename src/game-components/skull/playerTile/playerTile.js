import React, { Component } from 'reactn';
import './playerTile.css';
const images = require.context('../../../resources/skull', true);

class PlayerTile extends Component {
  constructor(props) {
    super(props);
    this.state = { betAmount: props.minBet }
  }

  getCard(card, colour, cardIndex, faceUp, click) {
    var frontCard = null;
    if (card.skull !== undefined) {
      frontCard = card.skull ?
        images('./' + colour + '_skull.png') :
        images('./' + colour + '_flower.png')
    }
    var backCard = images('./' + colour + '_back.png');
    return (
      <div key={cardIndex} onClick={click} className={`card ${faceUp ? '' : 'flipped'}`}>
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

  onBetAmountChange(event) {
    this.setState({ betAmount: event.target.value });
  }

  render() {
    var game = this.props.game;
    var player = game.players[this.props.playerIndex];
    var colour = player.state.colour;
    var baseImg = images('./' + colour + '_base.png');
    var playingPhase = game.state.phase === "playing";
    var bettingPhase = game.state.phase === "betting";
    var revealingPhase = game.state.phase === "revealing";

    return (
      <div>
        <h3>{player.displayName}{player.state.currentTurn && "*"}</h3>
        <div style={{ height: '120px' }}>
          <img src={baseImg} alt="base" className="base-card"></img>
          <div className="card-stack-vertical">
            {
              player.state.playedCards.map((card, index) =>
                this.getCard({}, colour, index, false, revealingPhase ? () => this.props.sendMove("revealCard", player.userId) : null))
            }
          </div>
        </div>
        <p>Current Bet: {player.state.currentBet}</p>
        <p>Hand: </p>
        <div style={{ display: 'flex' }} className={this.props.playerIsUser ? '' : 'card-stack-horizontal'}>
          {
            player.state.hand.map((card, index) =>
              this.getCard(card, colour, index, this.props.playerIsUser, playingPhase && this.props.playerIsUser && player.state.currentTurn ? () => this.props.sendMove("playCard", index) : null))
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
          this.props.playerIsUser &&
          <>
            <p>Controls:</p>
            <div>
              <input type="number" min={this.props.minBet} max={this.props.maxBet} value={this.state.betAmount} onChange={this.onBetAmountChange.bind(this)}></input>
              <button onClick={() => this.props.sendMove("bet", this.state.betAmount)} disabled={!player.state.currentTurn || player.state.playedCards.length === 0 || !(playingPhase || bettingPhase)}>
                {playingPhase ? 'Start Betting' : 'Raise Bet'}
              </button>
              <button disabled={!player.state.currentTurn || !bettingPhase}
                onClick={() => this.props.sendMove("pass", null)}>Pass
                </button>
            </div>
          </>
        }
      </div>
    );
  }
}

export default PlayerTile