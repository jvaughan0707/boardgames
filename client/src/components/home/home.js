import React, { Component } from 'reactn';
import Play from '../play/play'
import Lobbies from '../lobbies/lobbies'
import Loading from '../loading/loading';

class Home extends Component {
  constructor() {
    super();
    this.state = { loading: true }
  }

  componentDidMount() {
    const ws = this.global.webSocket;
    ws.on('gameStarted', this.onGameStarted.bind(this));
    ws.on('gameEnded', this.onGameEnded.bind(this));
   
    ws.on('connect', () =>
      ws.emit('getCurrentGame', game => {
        this.setGlobal({ game });
        this.setState({ loading: false });
      })
    );

    ws.emit('getCurrentGame', game => {
      this.setGlobal({ game });
      this.setState({ loading: false });
    });
  }

  componentWillUnmount() {
    const ws = this.global.webSocket;
    ws.off('gameStarted', this.onGameStarted.bind(this));
    ws.off('gameEnded', this.onGameEnded.bind(this));
  }

  onGameStarted(game) {
    this.setGlobal({ game });
  }

  onGameEnded() {
    this.setGlobal({ game: null })
  }

  render() {
    return (
      this.state.loading ? <Loading /> :
        this.global.game ? <Play /> :
          <Lobbies />
    );
  }
}

export default Home