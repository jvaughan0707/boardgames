import React from 'react';
import { useGlobal } from 'reactn';

const LobbyTiles = ({lobbies, inLobby}) => {
	const [ user ] = useGlobal('user');
	const [ ws ] = useGlobal('webSocket');
    return ( 
        (lobbies.length > 0 ? 
        <table>
            <tbody>
                {
                    lobbies.map(lobby => RenderTile(lobby, user)) 
                }
             </tbody>
        </table> :
        <p>No open lobbies. Create one by going to the Create tab!</p>)
       )

    function deleteGame (id) {
        ws.emit('deleteLobby', id);
    }

    function joinLobby (id) {
        ws.emit('joinLobby', id);
    }

    function leaveLobby (id) {
        ws.emit('leaveLobby', id);
    }

    function startGame (id) {
        ws.emit('startGame', id);
    }

    function RenderTile (lobby, user) {
        var key = "game" + lobby.gameId
        var isOwner = lobby.owner.userId === user.userId;
        return isOwner ? 
        <tr key={key}>
            <td>{lobby.owner.displayName}</td>
            <td>{lobby.gameType}</td>
            <td><button type="button" onClick={() => startGame(lobby.gameId)}>Start</button></td>
            <td><button type="button" onClick={() => deleteGame(lobby.gameId)}>Cancel</button></td>
        </tr> :
        
        <tr key={key}>
            <td>{lobby.owner.displayName}</td>
            <td>{lobby.gameType}</td>
            {
                lobby.players.map(p => 
                    <td key={"user" + p.userId}>{p.displayName}</td>
                    )
            }
            <td>
                {
                    inLobby && lobby.players.some(p => p.userId === user.userId) ?
                    <button type="button" onClick={() => leaveLobby(lobby.gameId)}>Quit</button> :
                    <button type="button" onClick={() => joinLobby(lobby.gameId)} disabled={inLobby}>Join</button>
                }
            </td>
        </tr>
    }
}
    
export default LobbyTiles