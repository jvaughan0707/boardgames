import React, { Component } from 'reactn';
import LobbyTiles from '../lobby-tiles/lobby-tiles'
import Loading from '../loading/loading'
import Create from '../create/create'

class Lobbies extends Component {
  constructor() {
    super();
    this.state = { loading: true, lobbies: [], inLobby: false }
  }

  componentDidMount() {
    const ws = this.global.webSocket;
    ws.on('lobbyCreated', this.onLobbyCreated.bind(this));
    ws.on('lobbyDeleted', this.onLobbyDeleted.bind(this));
    ws.on('lobbyPlayerJoined', this.onLobbyPlayerJoined.bind(this));
    ws.on('lobbyPlayerLeft', this.onLobbyPlayerLeft.bind(this));

    ws.emit('getOpenLobbies', lobbies =>
      this.setState({ lobbies, loading: false, inLobby: lobbies.some(lobby => lobby.players.some(p => p.userId === this.global.user.userId)) }));
  }

  componentWillUnmount() {
    const ws = this.global.webSocket;
    ws.off('lobbyCreated', this.onLobbyCreated.bind(this));
    ws.off('lobbyDeleted', this.onLobbyDeleted.bind(this));
    ws.off('lobbyPlayerJoined', this.onLobbyPlayerJoined.bind(this));
    ws.off('lobbyPlayerLeft', this.onLobbyPlayerLeft.bind(this));
  }

  onLobbyCreated(lobby) {
    var lobbies = this.state.lobbies.concat(lobby);
    this.setState({ lobbies })
  }

  onLobbyDeleted(lobbyId) {
    var lobbies = this.state.lobbies.filter(lobby => {
      if (lobby.lobbyId === lobbyId) {
        if (lobby.players.some(p => p.userId === this.global.user.userId)) {
          this.setState({ inLobby: false })
        }
        return false;
      }
      else {
        return true;
      }
    });

    this.setState({ lobbies })
  }

  onLobbyPlayerJoined(user, lobbyId) {
    var lobbies = this.state.lobbies.map(lobby => {
      if (lobby.lobbyId === lobbyId) {
        lobby.players.push(user);
      }
      return lobby;
    });
    var inLobby = this.state.inLobby || user.userId === this.global.user.userId
    this.setState({ lobbies, inLobby })
  }

  onLobbyPlayerLeft(userId, lobbyId) {
    var lobbies = this.state.lobbies.map(lobby => {
      if (lobby.lobbyId === lobbyId) {
        lobby.players = lobby.players.filter(p => p.userId !== userId);
      }

      return lobby;
    });
    lobbies = lobbies.filter(l => l.players.length > 0);
    var inLobby = this.state.inLobby && userId !== this.global.user.userId
    this.setState({ lobbies, inLobby })
  }

  render() {
    return (
      this.state.loading ?
        <Loading /> :
        <>
          <section>
            <h2>Create</h2>
            <Create allowCreate={!this.state.inLobby} />
          </section>
          <section>
            <h2>Join</h2>
            <LobbyTiles lobbies={this.state.lobbies} allowJoin={!this.state.inLobby}></LobbyTiles>
          </section>
        </>

    );
  }
}

export default Lobbies
