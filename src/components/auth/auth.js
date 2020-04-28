import React, {Component } from 'reactn';
import Cookies from 'universal-cookie';
import Loading from '../loading/loading';

const cookies = new Cookies();

class Auth extends Component { 
  
  constructor() {
    super ();
    var userId = cookies.get("userId");
    var userkey = cookies.get("userKey");
    var userLoaded = !userId;

    if (userId) {
      if (this.global.webSocket.isOpened) {
        this.getUser(userId, userkey);
      }
      else {
        this.global.webSocket.onOpen.addListener(() => {
          this.getUser(userId, userkey);
        });
      }
    }

    this.state = {userLoaded, displayName: ''};
  }

  getUser(userId, userKey) {
    var displayName = cookies.get('displayName');
    this.global.webSocket.sendRequest({
      info : { user : { userId, userKey } },
      action: 'validate',
      type: 'user'
    })
    .then(data => {
      if (!data.info.user) {
          if (displayName) {
            this.createUser(displayName);
          }
          else {
            this.setState({ userLoaded: true});
          }
      }
      else {
          this.setGlobal({ user: data.info.user });
          this.setState({ userLoaded: true});
      }
    })
    .catch(err => { 
        console.log(err); 
    })
  }

  handleChange = event => {
    this.setState({displayName: event.target.value });
  }

  submit () {
    if (this.global.webSocket.isOpened) {
      this.createUser();
    }
    else {
      this.global.webSocket.onOpen.addListener(() => {
        this.createUser();
      });
    }
  }
  createUser () {
      const displayName = this.state.displayName;
      this.global.webSocket.sendRequest({
        info : { displayName },
        action: 'create',
        type: 'user'
      })
      .then(data=> {
        const { _id, key } = data.info.user;
        if (_id && key) {
            cookies.set('displayName', displayName)
            cookies.set('userId', _id)
            cookies.set('userKey', key)
            const user =  {displayName, userId: _id, userKey: key};
            this.setGlobal({ user });
            this.setState({userLoaded: true});
        }
      });
  }

  render () {
    return (
        !this.state.userLoaded ? <Loading /> :
        this.global.user == null ? 
        <div className="preAuth">
          <label>Name:</label>
          <input type="text" onChange={ this.handleChange } name="displayName"></input>
          <button onClick={ this.submit.bind(this) }>Go!</button>
        </div> :
        <div className="App">  
            {this.props.children}
        </div>
    )
 }

}


export default Auth;
