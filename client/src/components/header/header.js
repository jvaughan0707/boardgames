import React from 'react';
import './header.css'
import { useGlobal } from 'reactn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

///
import Cookies from 'universal-cookie';
const cookies = new Cookies();
///

const Header = () => {
  const [user] = useGlobal('user');
  const [ws] = useGlobal('webSocket');

  ///
  var setCookies = (displayName, userId, userKey) => {
    var expiry = new Date();
    expiry.setDate(99999);

    cookies.set('displayName', displayName, { path: '/', expires: new Date(expiry) });
    cookies.set('userId', userId, { path: '/', expires: new Date(expiry) });
    cookies.set('userKey', userKey, { path: '/', expires: new Date(expiry) });
    window.location.reload();
  }
  ///

  return (
    <div id="header">
      <div id="dev-buttons">
        <button onClick={() => setCookies('', '', '')}>Reset</button>
        <button onClick={() => setCookies('Josh', '5ecfa7306c4bea03983ae193', 'hbsnrnmwtapcvkd06ahzzb')}>Josh</button>
        <button onClick={() => setCookies('Test', '5ecfac0f726ec53ac04517c6', '03o2s4popewfyxmoqupvz2e')}>1</button>
        <button onClick={() => setCookies('Test2', '5ed6a75b4b981a499839dcc3', 'toro2nnvv6c65ro7xytwl9')}>2</button>
        <button onClick={() => setCookies('Test3', '5ed6a76a4b981a499839dcc4', 'fysbhh6ssn4siwa3qd5uok')}>3</button>
        <button onClick={() => setCookies('Test4', '5ed6a7784b981a499839dcc5', 'x7by8hmsqniaagoch6ivd')}>4</button>
        <button onClick={() => setCookies('Test5', '5ed6a77c4b981a499839dcc6', 'p3ehesnm2fenmt1nzz0zr')}>5</button>
        <button onClick={() => setCookies('Test6', '5ed773894b981a499839dccc', '4or0d19bqcratn6gdkb9')}>6</button>
      </div>

      <div id="header-buttons" >
        {!(ws && ws.connected) && <FontAwesomeIcon icon="unlink"/>}
        {user && <FontAwesomeIcon icon="cog"  className="clickable"/>}
      </div>
    </div>
  );
}

export default Header