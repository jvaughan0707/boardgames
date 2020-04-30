import React from 'reactn';
import Component from '../component'
import { Redirect } from 'react-router';

class Create extends Component {
	constructor() {
        super();
        this.state = { redirect: false }
	}
	
	createGame = () => {
		var gameType= "Skull";
		const ws = this.global.webSocket;
		ws.emit('createGame', gameType, () => this.setState({redirect: true}));
	}

	render () {
		if (this.state.redirect) {
			return <Redirect push to="/" />;
		}
		
		return (
			<div className="page">
				<h1>Create</h1>
				<p>Select a game type below to create a lobby.</p>
				<button onClick={this.createGame}>Skull</button>
			</div>
		)
	}
}

export default Create