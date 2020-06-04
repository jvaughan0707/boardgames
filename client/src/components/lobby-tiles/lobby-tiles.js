import React from 'react';
import './lobby-tiles.css';
import { useGlobal } from 'reactn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function LobbyTiles({ lobbies, allowJoin }) {
  const [user] = useGlobal('user');
  const [ws] = useGlobal('webSocket');
  lobbies = lobbies.filter(lobby => lobby.players.length > 0);
  return (
    (lobbies.length > 0 ?
      lobbies.map(lobby => RenderTile(lobby)) :
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
      <div key={key} className='lobby-tile'>
        <h4>{lobby.title}</h4>
        <div className="lobby-players">
          {
            new Array(lobby.maxPlayers).fill(null)
              .map((x, i) => {
                let p = lobby.players[i];
                return p ?
                  (<div key={i} className="lobby-player">
                    {p.displayName}&nbsp;
                    {p.userId === user.userId && <FontAwesomeIcon icon="user" />}
                  </div>) :
                  (<div key={i} className="lobby-space"></div>)
                })
          }
        </div>
        <div className="lobby-controls">
          {
            isOwner ?
              <>
                <button type="button" onClick={() => startGame(lobby.lobbyId)} disabled={lobby.players.length < lobby.minPlayers}>Start</button>
                <button type="button" onClick={() => leaveLobby(lobby.lobbyId)}>Leave</button>
              </> :

              !allowJoin && lobby.players.some(p => p.userId === user.userId) ?
                <button type="button" onClick={() => leaveLobby(lobby.lobbyId)}>Leave</button> :
                <button type="button" onClick={() => joinLobby(lobby.lobbyId)} disabled={!allowJoin || lobby.players.length >= lobby.maxPlayers}>Join</button>
          }
        </div>
      </div>);
  }
}