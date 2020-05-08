import React from 'reactn';
import Component from '../component'
import Create from '../create/create'
import Play from '../play/play'
import Lobbies from '../lobbies/lobbies'
import Loading from '../loading/loading';

class Home extends Component {
    constructor() {
        super();
        this.state = { loading: true, inGame: false, inLobby: false}
    }

    componentDidMount() {
        const ws = this.global.webSocket;
        ws.on('joinedLobby', this.onLobbyJoined.bind(this));
        ws.on('leftLobby', this.onLobbyLeft.bind(this));
        ws.on('gameStarted', this.onGameStarted.bind(this));

        ws.emit('getUserGameStatus', game => {
            if (game) {
                this.setState({ inGame: game.started, inLobby: true, loading: false });
            }
            else {
                this.setState({ inGame: false, inLobby: false, loading: false });
            }
        });
    }

    componentWillUnmount() {
        const ws = this.global.webSocket;
        ws.off('joinedLobby', this.onLobbyJoined.bind(this));
        ws.off('leftLobby', this.onLobbyLeft.bind(this));
        ws.off('gameStarted', this.onGameStarted.bind(this));
    }

    onLobbyJoined () {
        this.setState({ inLobby: true })
    }

    onLobbyLeft () {
        this.setState({ inLobby: false })
    }
  
    onGameStarted () {
        this.setState({ inGame: true })
    }

    render() {
        return (
            this.state.loading ? <Loading/>:
            this.state.inGame ?  <Play/> :
            <>
                <Create inLobby={this.state.inLobby}/>
                <Lobbies inLobby={this.state.inLobby}/>
            </>
		);
	}
}

export default Home