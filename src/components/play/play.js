import React, {Component} from 'reactn';
import Skull from '../../game-components/skull/skull';

class Play extends Component {
	
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
        ws.emit('leaveGame', this.props.game.gameId);
	}

	render () {
		var game = this.props.game;
		return (
			<>
				<button onClick={this.leaveGame.bind(this)}>Quit</button>
				{ this.getGameComponent(game) }
			</>
		)
	}
}

export default Play