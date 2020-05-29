import React from 'react';
import { useGlobal } from 'reactn';

export default function LobbyTiles({ lobbies, allowJoin }) {
  const [user] = useGlobal('user');
  const [ws] = useGlobal('webSocket');
  lobbies = lobbies.filter(lobby => lobby.players.length > 0);
  return (
    (lobbies.length > 0 ?
      <table>
        <tbody>
          {
            lobbies.map(lobby => RenderTile(lobby))
          }
        </tbody>
      </table> :
      <p>No open lobbies.</p>)
  )

  function joinLobby(id) {
    ws.emit('joinLobby', id, user.displayName);
  }

  function leaveLobby(id) {
    ws.emit('leaveLobby', id);
  }

  function startGame(id) {
    ws.emit('startGame', id);
  }

  function RenderTile(lobby) {
    var key = "game" + lobby.lobbyId
    var isOwner = lobby.players[0].userId === user.userId;
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
              <td><button type="button" onClick={() => startGame(lobby.lobbyId)}>Start</button></td>
              <td><button type="button" onClick={() => leaveLobby(lobby.lobbyId)}>Leave</button></td>
            </> :

            <td>
              {
                !allowJoin && lobby.players.some(p => p.userId === user.userId) ?
                  <button type="button" onClick={() => leaveLobby(lobby.lobbyId)}>Leave</button> :
                  <button type="button" onClick={() => joinLobby(lobby.lobbyId)} disabled={!allowJoin}>Join</button>
              }
            </td>
        }
      </tr>);
  }
}