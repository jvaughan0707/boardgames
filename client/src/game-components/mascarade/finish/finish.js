import './finish.css';
import Overlay from '../../../components/overlay/overlay';
import React, { useGlobal } from 'reactn';

export default function Finish() {
  const [game] = useGlobal('game');
  const [ws] = useGlobal('webSocket');
  const [user] = useGlobal('user');

  var quit = () => {
    ws.emit('quit', game.gameId);
  }

  var rematch = () => {
    ws.emit('rematch', game.gameId, user.displayName);
  }

  var winnersText = game.state.winners.length > 0 ? ((game.state.winners.length > 1 ? 'Winners: ' : 'Winner: ')+
   game.state.winners.map(p => p.displayName).join(', ')) :
   'Game ended due to player leaving early';

  return (
    <Overlay width={300} height={150} zIndex={98} fade={true}>
      <h2>Game Over</h2>
      <p>{winnersText}</p>
      <div className="buttons">
        <button onClick={rematch}>Rematch</button>
        <button onClick={quit}>Home</button>
      </div>
    </Overlay>);
}