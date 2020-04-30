import React from 'reactn';
import Component from '../component'
import Loading from '../loading/loading';

class Play extends Component {
	constructor() {
        super();
        this.state = { game: null, gameLoading: true }
	}
	
	componentDidMount () {
		const ws = this.global.webSocket;
        ws.emit('getGame', game => {
			this.setState({game, gameLoading: false})
		});
	}
	
	render () {
		return (
			<div className="page">
				{
				 	this.state.gameLoading ? <Loading/> :
					this.state.game ? <h2>{this.state.game.gameType}</h2> :
					<p>You have no active games</p>
				}
			</div>
		)
	}
}

export default Play