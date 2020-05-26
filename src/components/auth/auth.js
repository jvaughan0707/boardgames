import React, { PureComponent } from 'reactn';
import Cookies from 'universal-cookie';
import Loading from '../loading/loading';
import io from 'socket.io-client';
const cookies = new Cookies();

class Auth extends PureComponent {
  constructor() {
    super();
    var displayName = cookies.get('displayName');
    this.state = { userValidated: false, displayName };
    if (displayName) {
      this.connect();
    }
  }

  handleChange(event) {
    this.setState({ displayName: event.target.value });
  }

  createUser() {
    this.setCookie('displayName', this.state.displayName);
    this.connect();
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
    this.setCookie('displayName', user.displayName);
    this.setCookie('userId', user.userId);
    this.setCookie('userKey', user.userKey);

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
      this.state.displayName ?
        (this.state.userValidated ?
          <div className="App">
            {this.props.children}
          </div> :
          <Loading />) :
        <div className="preAuth">
          <label>Name:</label>
          <input type="text" onChange={this.handleChange.bind(this)} name="displayName"></input>
          <button onClick={this.createUser.bind(this)}>Go!</button>
        </div>
    )
  }

}


export default Auth;
