import React from 'reactn';
import Component from '../component'

const games = [{type: "skull", title: "Skull"}]

class Create extends Component {
	createLobby = (info) => {
		const ws = this.global.webSocket;
		ws.emit('createLobby', info);
	}

	render () {
		return (
			<>
				<h2>Create</h2>
				<p>Select a game type below to create a lobby.</p>
				{
					games.map(game => {
						return <button key={game.type} onClick={() => this.createLobby(game)} disabled={!this.props.allowCreate}>{game.title}</button>
					})
				}
			</>
		)
	}
}

export default Create