import React, {Component} from 'reactn';
import LobbyTiles from '../lobby-tiles/lobby-tiles'
import Loading from '../loading/loading'

class Lobbies extends Component {
    constructor() {
        super();
        this.state = { loading: true, lobbies: [] }
    }

    componentDidMount() {
        const ws = this.global.webSocket;
        ws.on('lobbyCreated', this.onLobbyCreated.bind(this));
        ws.on('lobbyDeleted', this.onLobbyDeleted.bind(this));
        ws.on('lobbyPlayerJoined', this.onLobbyPlayerJoined.bind(this));
        ws.on('lobbyPlayerLeft', this.onLobbyPlayerLeft.bind(this));

        ws.emit('getOpenLobbies', lobbies => this.setState({lobbies, loading: false}));
    }

    componentWillUnmount() {
        const ws = this.global.webSocket;
        ws.off('lobbyCreated', this.onLobbyCreated.bind(this));
        ws.off('lobbyPlayerJoined', this.onLobbyPlayerJoined.bind(this));
        ws.off('lobbyPlayerLeft', this.onLobbyPlayerLeft.bind(this));
        ws.off('lobbyDeleted', this.onLobbyDeleted.bind(this));
    }

    onLobbyCreated (lobby) {
        var lobbies = this.state.lobbies.concat(lobby);
        this.setState({ lobbies })
    }

    onLobbyDeleted (gameId) {
        var lobbies = this.state.lobbies.filter(l => l.gameId !== gameId);

        this.setState({ lobbies })
    }
  
    onLobbyPlayerJoined (user, gameId) {
        var lobbies = this.state.lobbies.map(lobby =>
        {
            if (lobby.gameId === gameId) {
                lobby.players.push(user);
            }
            return lobby;
        });
        this.setState({ lobbies })
    }

    onLobbyPlayerLeft (userId, gameId, newOwnerId) {
        var lobbies = this.state.lobbies.map(lobby =>
        {
            if (lobby.gameId === gameId) {
                lobby.players = lobby.players.filter(p => p.userId !== userId);
                if (newOwnerId) {
                    lobby.ownerId = newOwnerId;
                }
            }
           
            return lobby;
        });
        lobbies = lobbies.filter(l => l.players.length > 0);
        this.setState({ lobbies })
    }

	render() {
		return (
            this.state.loading ? 
            <Loading/> :
            <div id="openLobbies" className="container">
                <h2>Matching</h2>
                <LobbyTiles lobbies={this.state.lobbies} allowJoin={this.props.allowJoin}></LobbyTiles>
            </div>
		);
	}
}

export default Lobbies
