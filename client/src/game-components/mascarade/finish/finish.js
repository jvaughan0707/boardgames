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

  var outcomeText = '';

  if (game.state.nominatedPlayer) {
    var nominatedPlayer = game.players.find(p => p.userId === game.state.nominatedPlayer.userId);
    if (nominatedPlayer.state.spy) {
      outcomeText = nominatedPlayer.displayName + ' was discovered as a spy. Non-spies win.';
    }
    else {
      outcomeText = nominatedPlayer.displayName + ' was falsely convicted as a spy. Spies win.';
    }
  }
  else {
    if (game.state.timerLength === 0) {
      outcomeText = 'No player was convicted. Spies win.';
    }
    else if (game.players.some(p => p.state.locationGuess)){
      var correctSpies = game.players.filter(p => p.state.locationGuess === game.state.locationId);
      if (correctSpies.length > 0) {
        outcomeText = correctSpies.map((p, i) => i === 0 ? p.displayName : ' and ' + p.displayName)
        outcomeText += ' guessed the location. Spies win.';
      }
      else {
        outcomeText = 'The spies guessed the wrong location. Non-spies win.';
      }
    }
    else {
      outcomeText = 'Game ended due to player leaving.';
    }
  }

  return (
    <Overlay width={300} height={150} zIndex={98} fade={true}>

      <h2>Game Over</h2>
      <p>{outcomeText}</p>
      <div className="buttons">
        <button onClick={rematch}>Rematch</button>
        <button onClick={quit}>Home</button>
      </div>
    </Overlay>);
}