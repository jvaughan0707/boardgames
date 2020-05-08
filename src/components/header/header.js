import React from 'react';
import {NavLink} from 'react-router-dom';
import './header.css'
import { useGlobal } from 'reactn';

const Header = () => {
	const [ user ] = useGlobal('user');
	return (
			<div id="Header">
        		<h1>Welcome {user.displayName}!</h1> 
				<div className="menu">
					<NavLink exact to="/">
						Play
					</NavLink>
					<NavLink exact to="/contribute" >
						Contribute
					</NavLink>
				</div>
			</div>
		);
}

export default Header