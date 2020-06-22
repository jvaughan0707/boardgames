import React from 'react';
import './header.css'
import { useGlobal } from 'reactn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ReactComponent as KnockIcon} from '../../resources/knock.svg'

const Header = (props) => {
  const [user] = useGlobal('user');
  const [ws] = useGlobal('webSocket');
  const [game] = useGlobal('game');
  const [mute] = useGlobal('mute');

  var knock = () => {
    ws.emit('knock');
  }

  return (
    <div id="header">
      <div id="header-buttons" >
        {!(ws && ws.connected) && <FontAwesomeIcon icon="unlink" />}
        {game && <FontAwesomeIcon icon="sign-out-alt" className="clickable" onClick={props.openLeaveGame} />}
        {game && <FontAwesomeIcon icon="question" className="clickable" onClick={props.openRules} />}
        {user && props.openSettings && <FontAwesomeIcon icon="cog" className="clickable" onClick={props.openSettings} />}
        {/* {user && !game && <KnockIcon className="clickable" onClick={knock} />} */}
        <FontAwesomeIcon icon={mute ? "volume-mute" : "volume-up"}  className="clickable" onClick={props.toggleMute} />
      </div>
    </div>
  );
}

export default Header
