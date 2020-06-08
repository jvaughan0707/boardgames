import React, { PureComponent } from 'reactn';
import Cookies from 'universal-cookie';
import Loading from '../loading/loading';
import io from 'socket.io-client';
import './auth.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const cookies = new Cookies();

class Auth extends PureComponent {
  constructor() {
    super();
    var displayName = cookies.get('displayName') || '';
    this.state = { userValidated: false, displayName };
    this.connect();
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

  connect() {
    const webSocket = io();
    webSocket.on('connect', () =>
      this.setGlobal({ webSocket })
    );

    webSocket.on('disconnect', () =>
      this.setGlobal({ webSocket })
    );

    webSocket.on('userValidated', this.onUserValidated.bind(this));
  }

  onUserValidated(user) {
    this.setCookie('userId', user.userId);
    this.setCookie('userKey', user.userKey);

    user.displayName = this.state.displayName;
    this.setGlobal({ user });
    this.setState({ userValidated: true });
  }

  setCookie(key, value) {
    var expiry = new Date();
    expiry.setDate(99999);

    cookies.set(key, value, { path: '/', expires: new Date(expiry) });
  }

  render() {
    return (
      this.state.userValidated ?
        (this.global.user && this.global.user.displayName ?
          this.props.children :
          <div className="pre-auth">
            <input maxLength="15" type="text" onChange={this.handleChange.bind(this)} name="displayName" placeholder="Enter a username"></input>
            <span id="submit">
              <FontAwesomeIcon icon="arrow-right" onClick={this.createUser.bind(this)} disabled={this.state.displayName.length === 0} />
            </span>
          </div>
        ) :
        <Loading />)
  }
}


export default Auth;
