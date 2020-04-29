import React from 'react';
import { useGlobal } from 'reactn';
import Loading from '../loading/loading'

const LobbyTiles = ({lobbies, gamesLoaded, deleteGame, joinGame}) => {
	const [ user ] = useGlobal('user');
    return ( gamesLoaded ? 
        (lobbies.length > 0 ? 
        <table>
            <tbody>
                {
                    lobbies.map(game => RenderTile(game, user)) 
                }
             </tbody>
        </table> :
        <p>No open lobbies. Create one by going to the Create tab!</p>) :
        <Loading />
       )

    function RenderTile (game, user) {
        var key = "game" + game._id
        var isOwner = game.ownerId === user.userId;
        return isOwner ? 
        <tr id={key} key={key}>
            <td>{game.owner}</td>
            <td></td>
            <td><button type="button" onClick={() => deleteGame(game._id)}>Cancel</button></td>
            <td><button type="button"onClick={invite}>Invite</button></td>
            <td><input type="text" defaultValue={`/play/${game._id}`} /></td>
        </tr> :
        
        <tr id={key} key={key}>
            <td>{game.owner}</td>
            <td>{game.gameType}</td>
            <td><button type="button" onClick={() => joinGame(game._id)}>Accept</button></td>
        </tr>
    }
    
    function invite () {}
    
}
    
export default LobbyTiles