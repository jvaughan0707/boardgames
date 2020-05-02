import React from 'reactn';
import Component from '../component'
import Create from '../create/create'
import Play from '../play/play'
import Lobbies from '../lobbies/lobbies'

class Home extends Component {

    constructor() {
        super();
        this.state = { games: [], gamesLoaded: false }
    }

    componentDidMount() {
        if (!this.global.game) {
            const ws = this.global.webSocket;
            ws.emit('getGame', null, game => {
                this.setGlobal({ game });
            });

            ws.on('joinGame', this.onGameJoined.bind(this));
        }
    }

    componentWillUnmount() {
        const ws = this.global.webSocket;
        ws.off('joinGame', this.onGameJoined.bind(this));
    }
 
    onGameJoined (gameId, userId) {
        if (userId == this.global.user.userId && !this.global.game) {
            const ws = this.global.webSocket;
            ws.emit('getGame', gameId, game => {
                this.setGlobal({ game });
            });
        }
    }

	render() {
        if (this.global.game) {
            return <Play/>
        }
		return (
            <>
                <Create/>
                <Lobbies/>
            </>
		);
	}
}

export default Home