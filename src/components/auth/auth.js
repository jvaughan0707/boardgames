import React from 'reactn';
import Component from '../component'
import Cookies from 'universal-cookie';
import Loading from '../loading/loading';

const cookies = new Cookies();

class Auth extends Component { 
  
  constructor() {
    super ();
    var displayName = cookies.get('displayName');
    this.state = {userLoaded: !displayName, displayName };
  }

  handleChange = event => {
    this.setState({ displayName: event.target.value });
  }

  createUser () {
    const displayName = this.state.displayName;
    const ws = this.global.webSocket;
    
    if (ws) {
      ws.emit('createUser', displayName, user => this.setUser(user))
    }
  }

  getUser() {
    const ws = this.global.webSocket;
    
    if (ws) {
      ws.emit('getUser', user => this.setUser(user))
    }
  }

  setUser(user) {
    if (user && user.displayName && user.userId && user.userKey) {
      cookies.set('displayName', user.displayName, {path: '/', expires: new Date(Date.now()+2592000)});
      cookies.set('userId', user.userId, {path: '/', expires: new Date(Date.now()+2592000)});
      cookies.set('userKey', user.userKey, {path: '/', expires: new Date(Date.now()+2592000)});
      this.setGlobal({ user });
      this.setState({userLoaded: true});
    }
  }

  render () {
    if (!this.state.userLoaded && this.state.displayName) {
      this.getUser();
    }
    return (
        !this.state.userLoaded ? <Loading /> :
        !this.global.user ? 
        <div className="preAuth">
          <label>Name:</label>
          <input type="text" onChange={ this.handleChange } name="displayName"></input>
          <button onClick={ this.createUser.bind(this) }>Go!</button>
        </div> :
        <div className="App">  
            {this.props.children}
        </div>
    )
 }

}


export default Auth;
