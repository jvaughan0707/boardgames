import React, { Component } from 'reactn';
import './create.css';
const skullImg = require('../../resources/skull/title.png');
const games = [{ type: "skull", title: "Skull", img: skullImg }]

class Create extends Component {
  createLobby = (info) => {
    const ws = this.global.webSocket;
    ws.emit('createLobby', info);
  }

  render() {
    return (
      <>
        <h2>Create</h2>
        <p>Select a game type below to create a lobby.</p>
        {
          games.map(game => {
            return (
              <div disabled={!this.props.allowCreate} className="game-tile" onClick={this.props.allowCreate ? () => this.createLobby(game.type) : null} key={game.type}>
                <img src={game.img} alt={game.title}></img>
                <h3>{game.title}</h3>
              </div>
            )
          })
        }
      </>
    )
  }
}

export default Create