import React, {Component} from 'reactn';
import Create from '../create/create'
import Play from '../play/play'
import Lobbies from '../lobbies/lobbies'
import Loading from '../loading/loading';

class Home extends Component {
    constructor() {
        super();
        this.state = { loading: true, game: null}
    }

    componentDidMount() {
        const ws = this.global.webSocket;
        ws.on('gameStatusChanged', this.onGameStatusChanged.bind(this));

        ws.emit('getCurrentGame', game => {
            if (game) {
                this.setState({ game, loading: false });
            }
            else {
                this.setState({ game: null, loading: false });
            }
        });
    }

    componentWillUnmount() {
        const ws = this.global.webSocket;
        ws.off('gameStatusChanged', this.onGameStatusChanged.bind(this));
    }

    onGameStatusChanged (game) {
        this.setState({game, loading: false});
    }

    render() {
        var game = this.state.game;
        return (
            this.state.loading ? <Loading/>:
            (game && game.started) ?  <Play game={game}/> :
            <>
                <Create allowCreate={game === null}/>
                <Lobbies allowJoin={game === null}/>
            </>
		);
	}
}

export default Home