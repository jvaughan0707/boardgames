import React from 'reactn';
import Component from '../component'
import Skull from '../../game-components/skull/skull';

class Play extends Component {

	constructor() {
        super();
        this.state = { loading: true, game: null }
	}
	
	componentDidMount () {
		if (!this.state.game) {
			const ws = this.global.webSocket;
        	ws.emit('getCurrentGame', (game) => this.setState({game}))
		}
	}


	getGameComponent (game) {
		switch (game.type.toLowerCase()) {
			case 'skull':
				return <Skull game={game}/>
			default:
				break;
		}
	}

	leaveGame () {
		//prompt are you sure?
		const ws = this.global.webSocket;
        ws.emit('leaveGame', this.state.game.gameId);
	}

	render () {
		var game = this.state.game;
		return (
			game &&
			<>
				<h2>{game.title}</h2>
				<button onClick={this.leaveGame.bind(this)}>Quit</button>
				{ this.getGameComponent(game) }
			</>
		)
	}
}

export default Play