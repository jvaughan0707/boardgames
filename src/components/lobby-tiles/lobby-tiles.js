import React from 'react';
import { useGlobal } from 'reactn';

export default function LobbyTiles ({lobbies, allowJoin}) {
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
        var isOwner = lobby.ownerId === user.userId;
        return (
        <tr key={key}>
            <td>{lobby.title}</td>
            {
                lobby.players.map(p => 
                    <td key={"user" + p.userId}>{p.displayName}</td>)
            }
            {
            isOwner ? 
                <>
                    <td><button type="button" onClick={() => startGame(lobby.gameId)}>Start</button></td>
                    <td><button type="button" onClick={() => leaveLobby(lobby.gameId)}>Leave</button></td>
                </> :

                <td>
                {
                    !allowJoin && lobby.players.some(p => p.userId === user.userId) ?
                    <button type="button" onClick={() => leaveLobby(lobby.gameId)}>Leave</button> :
                    <button type="button" onClick={() => joinLobby(lobby.gameId)} disabled={!allowJoin}>Join</button>
                }
                </td>
            }
        </tr>);
    }
}