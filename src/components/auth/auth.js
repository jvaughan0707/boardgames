import React from 'react';
import Component from '../component'
import Cookies from 'universal-cookie';
import Loading from '../loading/loading';

const cookies = new Cookies();

class Auth extends Component { 
  
  constructor() {
    super ();
    this.state = {userLoaded: false, displayName: ''};
  }

  componentDidMount() {
    if(this.global.webSocket) {
      this.getUser();
    }
  }

  getUser() {
    const ws = this.global.webSocket;
    var userId = cookies.get("userId");
    var displayName = cookies.get('displayName');

    if (userId) {
      ws.sendRequest({
        info : {},
        action: 'validate',
        type: 'user'
      })
      .then(data => {
        if (!data.info.user) {
            if (displayName) {
              this.createUser(displayName);
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
  }

  handleChange = event => {
    this.setState({displayName: event.target.value });
  }

  createUser () {
    const displayName = this.state.displayName;
    const ws = this.global.webSocket;
    ws.sendRequest({
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
          <button onClick={ this.submit }>Go!</button>
        </div> :
        <div className="App">  
            {this.props.children}
        </div>
    )
 }

}


export default Auth;
