import React from 'react';
import { useGlobal } from 'reactn';
import Loading from '../loading/loading'

const LobbyTiles = ({lobbies, gamesLoaded}) => {
	const [ user ] = useGlobal('user');
	const [ws] = useGlobal('ws');
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
        <tr id={key} key = {key}>
            <td>{game.owner}</td>
            <td></td>
            <td><button type="button" onClick={() => deleteGame(game._id)}>Cancel</button></td>
            <td><button type="button">Invite</button></td>
            <td><input type="text" defaultValue={`/play/${game._id}`} /></td>
        </tr> :
        
        <tr id={key} key = {key}>
            <td>{game.owner}</td>
            <td>{game.gameType}</td>
            <td><button type="button" onClick={() => joinGame(game._id)}>Accept</button></td>
        </tr>
    }
    
    function deleteGame (id) {
        var info = { id };
        ws.send(JSON.stringify({
            info,
            action: 'delete',
            type: 'game'
        }))
    }
    function invite () {}
    function joinGame (id) {
        var info = { id, user };
        ws.send(JSON.stringify({
            info,
            action: 'join',
            type: 'game'
        }))
    }
}




    
export default LobbyTiles