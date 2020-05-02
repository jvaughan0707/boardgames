import React from 'reactn';
import Component from '../component'

const games = [{type: "skull", title: "Skull"}]

class Create extends Component {
	createGame = (game) => {
		const ws = this.global.webSocket;
		ws.emit('createGame', game);
	}

	render () {
		return (
			<>
				<h2>Create</h2>
				<p>Select a game type below to create a lobby.</p>
				{
					games.map(game => {
						return <button key={game.type} onClick={() => this.createGame(game)}>{game.title}</button>
					})
				}
			</>
		)
	}
}

export default Create