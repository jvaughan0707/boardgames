import React, { PureComponent } from 'reactn';
import { gamesAPI } from '../api';
import LobbyTiles from '../lobby-tiles/lobby-tiles'

class Home extends PureComponent {

    constructor() {
        super();
        this.state = { games: [], gamesLoaded: false }
    }

    componentDidMount() {
        gamesAPI.get().then(json => {
            this.setState({ games: json, gamesLoaded: true})
        });   

        this.global.ws.onmessage = evt => {
            var data = JSON.parse(evt.data)
            if (data.type === "game") {
                if (data.action === "create") {
                    const game = data.info.game
                    var games = this.state.games.concat(game);
                    this.setState({ games })
                }
                else if (data.action === "delete") {
                    const id = data.info.id
                    var games = this.state.games.filter(g => g._id !== id);
                    this.setState({ games })
                }
            }
        }
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