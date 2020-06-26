import React, { Component } from 'reactn';
import './mascarade.scss';
import Finish from './finish/finish';
import Tile from '../common/tile/tile'
import Overlay from '../../components/overlay/overlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const images = require.context('../../resources/mascarade', true);

const characters = [
  { name: 'Judge', description: 'Takes all of the coins from the courthouse.', cardImage: images('./judge.png'), tokenImage: images('./judge_token.jpg') },
  { name: 'Bishop', description: 'Takes 2 coins from the richest player.', cardImage: images('./bishop.png'), tokenImage: images('./bishop_token.jpg') },
  { name: 'King', description: 'Takes 3 coins from the bank.', cardImage: images('./king.png'), tokenImage: images('./king_token.jpg') },
  { name: 'Fool', description: 'Takes 1 coin from the bank and swaps - or not - the cards of two other players.', cardImage: images('./fool.png'), tokenImage: images('./fool_token.jpg') },
  { name: 'Queen', description: 'Takes 2 coins from the bank.', cardImage: images('./queen.png'), tokenImage: images('./queen_token.jpg') },
  { name: 'Thief', description: 'Takes 1 coin from each of the players next to them.', cardImage: images('./thief.png'), tokenImage: images('./thief_token.jpg') },
  { name: 'Witch', description: 'Swaps all of her fortune with a player of her choice.', cardImage: images('./witch.png'), tokenImage: images('./witch_token.jpg') },
  { name: 'Spy', description: 'Secretly looks at their card and another card before swapping - or not.', cardImage: images('./spy.png'), tokenImage: images('./spy_token.jpg') },
  { name: 'Peasant', description: 'Takes 1 coin from the bank, or 2 if more than one peasant is revealed.', cardImage: images('./peasant.png'), tokenImage: images('./peasant_token.jpg') },
  { name: 'Cheat', description: 'Wins the game if they have 10 or more coins.', cardImage: images('./cheat.png'), tokenImage: images('./cheat_token.jpg') },
  { name: 'Inquisitor', description: 'Chooses a player to guess their character. If they are wrong, they pay 4 coins to the Inquisitor.', cardImage: images('./inquisitor.png'), tokenImage: images('./inquisitor_token.jpg') },
  { name: 'Widow', description: 'Takes coins from the bank to bring her fortune up to 10 coins in total.', cardImage: images('./widow.png'), tokenImage: images('./widow_token.jpg') }
]

class Mascarade extends Component {
  constructor(props) {
    super(props);
    this.state = { charactersOpen: false, pickingCharacter: false }
  }

  sendMove = (type, data) => {
    if (!this.state.updating) {
      this.global.webSocket.emit("gameAction", this.global.game.gameId, type, data, error => console.log(error));
    }
  }

  getControls(user) {
    var game = this.global.game;
    var currentTurnPlayer = game.players[game.state.currentTurnIndex];

    if (!game.state.started) {
      if (user.state.accept) {
        return (
          <>
            <p>Waiting for all players to be ready</p>
          </>);
      }
      else {
        return (
          <>
            <p>Click ready once you have seen all of the cards</p>
            <button onClick={() => this.sendMove('accept')}>Ready</button>
          </>);
      }
    }

    if (!currentTurnPlayer.state.actionTaken) {
      if (user.state.currentTurn) {
        if (this.state.pickingCharacter) {
          return (<>
            <p>Pick a character below.</p>
            <button onClick={() => this.setState({ pickingCharacter: false })}>Cancel</button>
          </>)
        }
        else {
          return (
            <>
              <p>Choose an action:</p>
              <button onClick={() => this.sendMove('swap')}>Swap (or not)</button>
              <button onClick={() => this.sendMove('inspect')} disabled={user.state.mustSwap}>Inspect your Card</button>
              <button onClick={() => this.setState({ pickingCharacter: true })} disabled={user.state.mustSwap}>Announce your character</button>
            </>);
        }
      }
      else {
        return (<p>Waiting for {currentTurnPlayer.displayName} to take an action.</p>)
      }
    }
    else if (currentTurnPlayer.state.revealedCards) {
      if (user.state.currentTurn) {
        return (<>
          <p>Press ready once you have seen your card.</p>
          <button onClick={() => this.sendMove('accept')}>Ready</button>
        </>);
      }
      else {
        return (<p>{currentTurnPlayer.displayName} is looking at their card.</p>);
      }
    }
    else if (currentTurnPlayer.state.claim !== null) {
      if (!user.state.accept && user.state.claim === null) {
        return (
          <>
            <p>{currentTurnPlayer.displayName} claims to be the {characters[currentTurnPlayer.state.claim].name}.</p>
            <button onClick={() => this.sendMove('accept')}>Accept</button>
            <button onClick={() => this.sendMove('challenge')}>Challenge</button>
          </>)
      }
      else if (currentTurnPlayer.state.playerOptions) {
        if (user.state.currentTurn) {
          return (<p>Select a player</p>)
        }
        else {
          return (<p>{currentTurnPlayer.displayName} is selecting a player.</p>);
        }
      }
      else if (currentTurnPlayer.state.selectedCards) {
        if (currentTurnPlayer.state.selectedCards.every(c => c)) {
          switch (currentTurnPlayer.state.claim) {
            case 3: //fool
              return (<>
                <p>Choose whether to swap or not.</p>
                <button onClick={() => this.sendMove('swapOrNot', true)}>Swap</button>
                <button onClick={() => this.sendMove('swapOrNot', false)}>Dont swap</button>
              </>);
            case 7: //spy
              return (<>
                <p>Choose whether to swap or not.</p>
                <button onClick={() => this.sendMove('swapOrNot', true)}>Swap</button>
                <button onClick={() => this.sendMove('swapOrNot', false)}>Dont swap</button>
              </>);
            default:
              break;
          }
        }
        else {
          if (user.state.currentTurn) {
            return (<p>Select a card</p>)
          }
          else {
            return (<p>{currentTurnPlayer.displayName} is selecting a card.</p>);
          }
        }
      }
      else {
        return (<p>Waiting for all players to respond.</p>)
      }
    }
    else if (currentTurnPlayer.state.selectedCards) {
      if (currentTurnPlayer.state.selectedCards.every(c => c)) {
        if (user.state.currentTurn) {
          return (<>
            <p>Choose whether to swap or not.</p>
            <button onClick={() => this.sendMove('swapOrNot', true)}>Swap</button>
            <button onClick={() => this.sendMove('swapOrNot', false)}>Dont swap</button>
          </>);
        }
        else {
          return (<p>{currentTurnPlayer.displayName} is deciding whether to swap or not.</p>);
        }
      }
      else {
        if (user.state.currentTurn) {
          return (<p>Select a card</p>);
        }
        else {
          return (<p>{currentTurnPlayer.displayName} is swapping. Waiting for them to select a card</p>);
        }
      }
    }
  }

  getPlayerPosition(index) {
    var playerCount = this.global.game.players.length;
    var x = 0;
    var y = 0;

    if (playerCount <= 9) {
      let angle = index * 2 * Math.PI / playerCount;
      angle = angle - Math.sin(angle * 2) * Math.PI / 50;
      let length = 50 + Math.pow(Math.sin(angle * 2), 2) * 5;
      x = 50 + Math.sin(angle) * length;
      y = 50 - Math.cos(angle) * length;
    }
    else if (playerCount === 10) {
      if (index < 2 || index >= 9) {
        x = (((index + 1) % 10) * 30 + 20);
      }
      else if (4 <= index && index < 7) {
        y = 100;
        x = ((6 - index) * 30 + 20);
      }
      else if (index < 4) {
        x = 100;
        y = index === 2 ? 33.3 : 66.6;
      }
      else {
        y = index === 8 ? 33.3 : 66.6;
      }
    }
    else if (playerCount === 11) {
      if (index < 2 || index >= 10) {
        x = (((index + 1) % 11) * 30 + 20);
      }
      else if (4 <= index && index < 8) {
        y = 100;
        x = ((7 - index) * 30 + 5);
      }
      else if (index < 4) {
        x = 100;
        y = index === 2 ? 33.3 : 66.6;
      }
      else {
        y = index === 9 ? 33.3 : 66.6;
      }
    }
    else {
      if (index < 2 || index >= 10) {
        x = (((index + 2) % 4) * 30 + 5);
      }
      else if (4 <= index && index < 8) {
        y = 100;
        x = ((7 - index) * 30 + 5);
      }
      else if (index < 4) {
        x = 100;
        y = index === 2 ? 33.3 : 66.6;
      }
      else {
        y = index === 9 ? 33.3 : 66.6;
      }
    }

    return { x, y }
  }

  render() {
    var game = this.global.game;
    var players = game.players;
    var userIndex = players.findIndex(p => p.userId === this.global.user.userId);
    var user = players[userIndex];
    var currentTurnPlayer = game.players[game.state.currentTurnIndex];
    players = [...players.slice(userIndex), ...players.slice(0, userIndex)];
    var courtPos = {
      x: 65,
      y: game.state.cards.length === 0 ? 50 : 35,
    };
    var bankPos = {
      x: game.state.cards.length === 0 ? 35 : 65,
      y: game.state.cards.length === 0 ? 50 : 65,
    };

    return (
      <>
        {
          game.finished &&
          <Finish />
        }
        <div id="mascarade-container">
          <button onClick={() => this.sendMove('reset')}>Reset</button>
          <div id="table">
            {
              players.map((p, index) => {
                var pos = this.getPlayerPosition(index);
                var revealedCard = p.state.revealedCards ?
                  p.state.revealedCards.find(c => c.userId === p.userId) : null;
                var card = revealedCard || p.state.card;
                var selected = currentTurnPlayer.state.selectedCards &&
                  currentTurnPlayer.state.selectedCards.some(c => c && c.userId === p.userId);

                var cardClick = user.state.selectedCards &&
                  !user.state.selectedCards.every(c => c) &&
                  !selected ?
                  () => this.sendMove('selectCard', { userId: p.userId }) : null;

                var playerClick = user.state.playerOptions &&
                  user.state.playerOptions.some(o => o === p.userId) ?
                  () => this.sendMove('selectPlayer', p.userId) : null;

                return <React.Fragment key={index}>
                  <div className={`player-tile ${playerClick ? 'clickable' : ''}`}
                    onClick={playerClick}
                    style={{ left: pos.x + '%', top: pos.y + '%', zIndex: playerClick ? 50 : 0 }}>
                    <div className="player-name">{p.displayName}</div> {
                      p.state.coins.length > 0 &&
                      <div className="money-counter">x {p.state.coins.length}</div>
                    }
                  </div>
                  <Tile
                    frontImg={card.value === null ? null : characters[card.value].cardImage}
                    backImg={images('./back.png')}
                    click={cardClick}
                    className="card"
                    animated={this.props.animate}
                    posX={selected ? 50 : pos.x}
                    posY={selected ? -500 : pos.y}
                    rotateY={card.revealed ? 0 : 180}
                    zIndex={0} />
                </React.Fragment>
              })
            }
            {
              game.state.cards &&
              game.state.cards.map((c, index) => {
                var selected = currentTurnPlayer.state.selectedCards &&
                  currentTurnPlayer.state.selectedCards.some(c => c && c.index === index);

                var click = user.state.selectedCards &&
                  !user.state.selectedCards.every(c => c) &&
                  !selected ?
                  () => this.sendMove('selectCard', { index }) : null;

                return <Tile key={index}
                  frontImg={c.value === null ? null : characters[c.value].cardImage}
                  backImg={images('./back.png')}
                  click={click}
                  className="card"
                  animated={this.props.animate}
                  posX={selected ? 50 : game.state.cards.length > 1 ? (35 + index * 15) : 40}
                  posY={selected ? -200 : 50}
                  rotateY={c.revealed ? 0 : 180}
                  zIndex={0} />
              })
            }
            <div id="court" style={{ left: courtPos.x + '%', top: courtPos.y + '%' }}>
              <img alt="court" src={images('./court.png')}></img>
              {
                game.state.courtCoins.length > 0 &&
                <div className="money-counter">x {game.state.courtCoins.length}</div>
              }
            </div>
            <div id="bank" style={{ left: bankPos.x + '%', top: bankPos.y + '%' }}></div>
            {
              [
                ...players.map((p, i) =>
                  p.state.coins.map((c, ci) => <img key={c.key} alt="coin" className="coin" src={images('./coin.png')}
                    style={{
                      left: this.getPlayerPosition(i).x + '%',
                      top: this.getPlayerPosition(i).y + '%',
                      transform: 'translate(20%, -50%)',
                      zIndex: ci,
                      transitionDelay: (p.state.coins.length - ci) * 100 + 'ms'
                    }}></img>)
                ),
                game.state.bankCoins.map((c, i) => <img key={c.key} alt="coin" className="coin" src={images('./coin.png')}
                  style={{
                    left: bankPos.x + 2 * Math.cos((i % 5) * 2 * Math.PI / 5) + '%',
                    top: bankPos.y + 2 * Math.sin((i % 5) * 2 * Math.PI / 5) + '%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: i
                  }}></img>),
                game.state.courtCoins.map((c, i) => <img key={c.key} alt="coin" className="coin" src={images('./coin.png')}
                  style={{
                    left: courtPos.x + '%',
                    top: courtPos.y + '%',
                    transform: 'translate(-70%, -50%)',
                    zIndex: i,
                    transitionDelay: (game.state.courtCoins.length - i) * 100 + 'ms'
                  }}></img>)
              ].flat().sort((a, b) => a.key - b.key)
            }
          </div>
          <div id="controls">
            {
              this.getControls(user)
            }
          </div>
          {
            this.state.charactersOpen &&
            <Overlay close={() => this.setState({ charactersOpen: false })}>
              <h3>Characters in this game:</h3>
              {
                game.state.characters.map(c => {
                  var character = characters[c];
                  return (
                    <div key={c} className="character-row">
                      <img alt={character.name}
                        title={character.name}
                        src={character.tokenImage}
                        className="character-token"></img>
                      <span>
                        <strong>{character.name}</strong>
                        &nbsp;-&nbsp;
                        {character.description}
                      </span>
                    </div>)
                })
              }
            </Overlay>
          }
          <div id="characters-container">
            <FontAwesomeIcon id="character-button" className="clickable" icon="external-link-alt"
              onClick={() => this.setState({ charactersOpen: true })}></FontAwesomeIcon>
            <div id="characters">
              {
                game.state.characters.map(c => {
                  var click = this.state.pickingCharacter ? () => this.sendMove('claim', c) : null;
                  var character = characters[c];
                  return <img key={c}
                    alt={character.name}
                    title={character.name}
                    src={character.tokenImage}
                    onClick={click}
                    className={`character-token ${click ? 'clickable' : ''}`}></img>
                })
              }
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default Mascarade