import React from 'reactn';
import Component from '../component'
import { gamesAPI } from '../api';
import LobbyTiles from '../lobby-tiles/lobby-tiles'

class Home extends Component {

    constructor() {
        super();
        this.state = { games: [], gamesLoaded: false }
    }

    componentDidMount() {
        gamesAPI.get().then(json => {
            this.setState({ games: json, gamesLoaded: true})
        });   
        
        var self = this;

        this.addWebSocketListener ("game", "create", "home", function(data) {
            const game = data.info.game
            var games = self.state.games.concat(game);
            self.setState({ games })
        });

        this.addWebSocketListener ("game", "delete", "home", function(data) {
            const id = data.info.id
            var games = self.state.games.filter(g => g._id !== id);
            self.setState({ games })
        });
    }

	render() {
        var openLobbies = this.state.games.filter(g => !g.started);
        var myActiveGames = this.state.games.filter(g => g.ownerId === this.global.user.userId && g.started);
		return (
            <div className="page">
                <div id="activeSearchesContainer" className="container">
                    <h2>Matching</h2>
                    <LobbyTiles lobbies={openLobbies} gamesLoaded={this.state.gamesLoaded}></LobbyTiles>
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