import React, { PureComponent } from 'reactn';
import { Redirect } from 'react-router';

class Create extends PureComponent {
	constructor() {
        super();
        this.state = { redirect: false }
	}
	
	createGame = () => {
		var info = { gameType: "Skull", user: this.global.user };
		this.global.ws.send(JSON.stringify({
			info,
			action: 'create',
			type: 'game'
		}))
		this.setState({redirect: true});
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