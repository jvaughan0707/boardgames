import './finish.css';
import Overlay from '../../../components/overlay/overlay';
import React, { useGlobal } from 'reactn';
import Confetti from 'react-confetti'

export default function Finish() {
  const [game] = useGlobal('game');
  const [ws] = useGlobal('webSocket');
  const [user] = useGlobal('user');
  var winner = game.state.winner;

  var quit = () => {
    ws.emit('quit', game.gameId);
  }

  var rematch = () => {
    ws.emit('rematch', game.gameId, user.displayName);
  }

  return (
    <Overlay width={300} height={150 + 35 * game.players.length} zIndex={98} fade={true}>
      <Confetti width={400} height={200 + 35 * game.players.length} numberOfPieces={200} recycle={false} />
      <h2>Winner: {winner.displayName}</h2>
      <h3>Scores:</h3>
      {game.players.sort((a, b) => {
        if (a.userId === winner.userId) {
          return -1;
        }
        else if (b.userId === winner.userId) {
          return 1;
        }
        else {
          return b.state.score - a.state.score;
        }
      }).map((p, i) => <p key={i}>{p.displayName} - {p.state.score}</p>)}
      <div className="buttons">
        <button onClick={rematch}>Rematch</button>
        <button onClick={quit}>Home</button>
      </div>
    </Overlay>);
}