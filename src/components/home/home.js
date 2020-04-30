import React from 'reactn';
import Component from '../component'
import LobbyTiles from '../lobby-tiles/lobby-tiles'

class Home extends Component {

    constructor() {
        super();
        this.state = { games: [], gamesLoaded: false }
    }

    componentDidMount() {
        const ws = this.global.webSocket;
        ws.emit('getGames', games => {
            this.setState({ games, gamesLoaded: true })
        });

        ws.on('createGame',(game) => {
            var games = this.state.games.concat(game);
            this.setState({ games })
        });

        ws.on('deleteGame',(gameId) => {
            var games = this.state.games.filter(g => g._id !== gameId);
            this.setState({ games })
        });
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
        var myActiveGames = this.state.games.filter(g => g.ownerId === this.global.user.userId && g.started);
		return (
            <div className="page">
                <div id="activeSearchesContainer" className="container">
                    <h2>Matching</h2>
                    <LobbyTiles lobbies={openLobbies} gamesLoaded={this.state.gamesLoaded} deleteGame={this.deleteGame.bind(this)} joinGame={this.joinGame.bind(this)}></LobbyTiles>
                </div>
            
                <div id="activeGamesContainer" className="container">
                {   
                    myActiveGames.Count > 0 &&
                    <React.Fragment>
                        <hr />
                        <h2>Your Active Games</h2>
                        <p>You still have unfinished games! You can continue playing, or delete them.</p>
                        <table>
                            {
                                myActiveGames.map(game => 
                                {
                                    return (
                                    <tr id={"game" + game._id}>
                                        <td><button type="button">Go To Game</button></td>
                                        <td><button type="button">Quit</button></td>
                                    </tr>)
                                })
                            }
                        </table>
                    </React.Fragment>
                }
                </div>
            </div>
		);
	}
}



export default Home