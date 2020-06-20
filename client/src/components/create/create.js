import React, { Component } from 'reactn';
import './create.css';
const skullImg = require('../../resources/skull/title.png');
const spyfallImg = require('../../resources/spyfall/title.jpg');
const mascaradeImg = require('../../resources/mascarade/title.jpg');

const games = [
  { type: "skull", title: "Skull", img: skullImg }, 
  { type: "spyfall", title: "Spyfall", img: spyfallImg },
  { type: "mascarade", title: "Mascarade", img: mascaradeImg, disabled: true },
]

class Create extends Component {
  createLobby = (type) => {
    const ws = this.global.webSocket;
    ws.emit('createLobby', type, this.global.user.displayName);
  }

  render() {
    return (
      <>
        <p>Select a game type below to create a lobby.</p>
        <div id="game-tiles">
        {
          games.map(game => {
            var canCreate = this.props.allowCreate && !game.disabled;
            return (
              <div className={`game-tile ${ canCreate ? 'clickable' : ''} ${ game.disabled ? 'disabled' : ''}`}  onClick={canCreate ? () => this.createLobby(game.type) : null} key={game.type}>
                <div className="thumbnail-container">
                  <img className="thumbnail" src={game.img} alt={game.title}></img>
                </div>
              </div>
            )
          })
        }
        </div>
      </>
    )
  }
}

export default Create