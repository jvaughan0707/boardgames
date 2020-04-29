import React from 'reactn';
import Component from '../component'
import LobbyTiles from '../lobby-tiles/lobby-tiles'

class Home extends Component {

    constructor() {
        super();
        this.state = { games: [], gamesLoaded: false }
    }

    componentDidMount() {
        this.sendRequest({
            info : {},
            action: 'get',
            type: 'game'
        }).then((data) => {
            this.setState({ games: data.info.games, gamesLoaded: true })
        });
        
        this.addWebSocketListener("game", "create", this.onGameCreated.bind(this));

        this.addWebSocketListener("game", "delete", this.onGameDeleted.bind(this));
    }

    componentWillUnmount() {
        this.removeWebSocketListeners();
    }

    onGameCreated (data) {
        const game = data.info.game
        var games = this.state.games.concat(game);
        this.setState({ games })
    }
    onGameDeleted (data) {
        const id = data.info.id
        var games = this.state.games.filter(g => g._id !== id);
        this.setState({ games })
    }

    deleteGame (id) {
        var info = { id };
        this.sendRequest({
            info,
            action: 'delete',
            type: 'game'
        });
    }

    joinGame (id) {
        var info = { id };
        this.sendRequest({
            info,
            action: 'join',
            type: 'game'
        });
    }

	render() {
        var openLobbies = this.state.games.filter(g => !g.started);
        var myActiveGames = this.state.games.filter(g => g.ownerId === this.global.user.userId && g.started);
		return (
            <div className="page">
                <div id="activeSearchesContainer" className="container">
                    <h2>Matching</h2>
                    <LobbyTiles lobbies={openLobbies} gamesLoaded={this.state.gamesLoaded} deleteGame={this.deleteGame} joinGame={this.joinGame}></LobbyTiles>
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
                                        <td><button type="button" onclick="joinGame(@game.Id)">Continue</button></td>
                                        <td> <button type="button" onclick="deleteGame(@game.Id)">Delete</button></td>
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