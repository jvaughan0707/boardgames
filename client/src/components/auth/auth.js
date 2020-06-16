import React, { PureComponent } from 'reactn';
import Cookies from 'universal-cookie';
import './auth.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const cookies = new Cookies();

class Auth extends PureComponent {
  constructor() {
    super();
    var displayName = cookies.get('displayName') || '';
    this.state = { displayName };
  }

  handleChange(event) {
    this.setState({ displayName: event.target.value });
  }

  createUser() {
    this.setCookie('displayName', this.state.displayName);
    var user = this.global.user;
    user.displayName = this.state.displayName;
    this.setGlobal({ user });
  }

  setCookie(key, value) {
    var expiry = new Date();
    expiry.setDate(99999);

    cookies.set(key, value, { path: '/', expires: new Date(expiry) });
  }

  render() {
    return (
      this.global.user && this.global.user.displayName ?
        this.props.children :
        <div id="pre-auth" className="centered">
          <input maxLength="15" type="text" onChange={this.handleChange.bind(this)} name="displayName" placeholder="Enter a username"></input>
          <span id="submit">
            <FontAwesomeIcon icon="arrow-right" onClick={this.createUser.bind(this)} disabled={this.state.displayName.length === 0} />
          </span>
        </div>
    )
  }
}

export default Auth;
