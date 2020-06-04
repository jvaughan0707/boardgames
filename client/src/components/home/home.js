import React, { Component } from 'reactn';
import Play from '../play/play'
import Lobbies from '../lobbies/lobbies'
import Loading from '../loading/loading';

class Home extends Component {
  constructor() {
    super();
    this.state = { loading: true, game: null }
  }

  componentDidMount() {
    const ws = this.global.webSocket;
    ws.on('gameStarted', this.onGameStarted.bind(this));
    ws.on('gameEnded', this.onGameEnded.bind(this));

    ws.emit('getCurrentGame', game =>
      this.setState({ game, loading: false })
    );
  }

  componentWillUnmount() {
    const ws = this.global.webSocket;
    ws.off('gameStarted', this.onGameStarted.bind(this));
    ws.off('gameEnded', this.onGameEnded.bind(this));
  }

  onGameStarted(game) {
    this.setState({ game, loading: false });
  }

  onGameEnded() {
    this.setState({ game: null })
  }

  render() {
    var game = this.state.game;
    return (
      this.state.loading ? <Loading /> :
        game ? <Play game={game} /> :
          <Lobbies allowJoin={game === null} />
    );
  }
}

export default Home