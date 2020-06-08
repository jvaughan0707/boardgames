import React from 'react';
import './header.css'
import { useGlobal } from 'reactn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Header = () => {
  const [user] = useGlobal('user');
  const [ws] = useGlobal('webSocket');

  return (
    <div id="header">
      <div id="header-buttons" >
        {!(ws && ws.connected) && <FontAwesomeIcon icon="unlink"/>}
        {user && <FontAwesomeIcon icon="cog"  className="clickable"/>}
      </div>
    </div>
  );
}

export default Header