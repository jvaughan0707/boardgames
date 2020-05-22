import React, {Component} from 'reactn';

const colours = ["#ff0000", "#0000ff"];

class Skull extends Component {
	constructor(props) {
		super(props);
		this.state = {game: props.game}
	}

	user = this.global.user;
	
	getPlayerTile (player)  {
		var playerIsCurrentUser = player.userId === this.user.userId;
		return (
			<div key={player.userId}>
				<h3>{player.displayName}{ this.state.game.state.currentTurnPlayer === player.state.turnOrder && "*"}</h3>
				<p>Cards: </p>
				{ 
					player.state.cards.map((card, index) => 
						this.getCard(card, player.state.turnOrder, index, playerIsCurrentUser))
				}
			</div>
		);
	}

	getCard (card, playerIndex, cardIndex, playerIsCurrentUser) {
		var colour = colours[playerIndex];
		return (
			<div style={{backgroundColor: colour}} key={cardIndex} 
				onClick={playerIsCurrentUser ? () => this.playCard(cardIndex) : null}>
				{
					playerIsCurrentUser ? 
					card.skull ? 
					<p>Skull</p> :
					<p>Flower</p> :
					<p>Unkown</p> 
				}
			</div>
		)
	}

	playCard (index) {
		var ws = this.global.webSocket;
		ws.emit("gameAction", this.state.game.gameId, "cardPlayed", index)
	} 

	render () {
		return (
			<>
				<p>Now playing skull</p>
				<p>Current phase: {	this.state.game.state.playingPhase ? 'Playing' : 'Betting'}</p>
				<p>Players</p>
				{
					this.state.game.players.sort(p => p.turnOrder).map(p => this.getPlayerTile(p))
				}
			</>
		)
	}
}


export default Skull