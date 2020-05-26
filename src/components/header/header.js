import React from 'react';
import {NavLink} from 'react-router-dom';
import './header.css'
import { useGlobal } from 'reactn';

const Header = () => {
	const [ user ] = useGlobal('user');
	const [ ws ] = useGlobal('webSocket');
	return (
			<div id="Header">
					{/* <NavLink exact to="/">
						Play
					</NavLink> */}
					{/* <NavLink exact to="/settings" >
						Settings
					</NavLink> */}
        
        <h2 id="displayName" style={{color: ws.connected ? 'white': 'red'}}>Welcome {user.displayName}!</h2> 
			</div>
		);
}

export default Header