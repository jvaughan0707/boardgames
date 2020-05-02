import React from 'reactn';
import Component from '../component'
import LobbyTiles from '../lobby-tiles/lobby-tiles'

class Lobbies extends Component {

    constructor() {
        super();
        this.state = { games: [], gamesLoaded: false }
    }

    componentDidMount() {
        const ws = this.global.webSocket;
        ws.emit('getGames', games => {
            this.setState({ games, gamesLoaded: true })
        });

        ws.on('createGame', this.onGameCreated.bind(this));
        ws.on('deleteGame', this.onGameDeleted.bind(this));
        ws.on('joinGame', this.onGameJoined.bind(this));
    }

    componentWillUnmount() {
        const ws = this.global.webSocket;
        ws.off('createGame', this.onGameCreated.bind(this));
        ws.off('deleteGame', this.onGameDeleted.bind(this));
        ws.off('joinGame', this.onGameJoined.bind(this));
    }

    onGameCreated (game) {
        var games = this.state.games.concat(game);
        this.setState({ games })
    }

    onGameDeleted (gameId) {
        var games = this.state.games.filter(g => g._id !== gameId);
        this.setState({ games })
    }

    onGameJoined (gameId, userId) {
       
    }

    deleteGame (id) {
        const ws = this.global.webSocket;
        ws.emit('deleteGame', id);
    }

    joinGame (id) {
        const ws = this.global.webSocket;
        ws.emit('joinGame', id);
    }

	render() {
        var openLobbies = this.state.games.filter(g => !g.started);
		return (
            <div id="openLobbies" className="container">
                <h2>Matching</h2>
                <LobbyTiles lobbies={openLobbies} gamesLoaded={this.state.gamesLoaded} deleteGame={this.deleteGame.bind(this)} joinGame={this.joinGame.bind(this)}></LobbyTiles>
            </div>
		);
	}
}

export default Lobbies
