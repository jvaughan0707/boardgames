import React from 'reactn';
import Component from '../component'
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
      this.getUser(userId, userkey);
    }

    this.state = {userLoaded, displayName: ''};
  }

  getUser(userId, userKey) {
    var displayName = cookies.get('displayName');
    var user = { displayName, userId, userKey }
    this.sendRequest({
      info : { user  },
      action: 'validate',
      type: 'user'
    })
    .then(data => {
      if (!data.info.success) {
          if (displayName) {
            this.createUser(displayName);
          }
          else {
            this.setState({ userLoaded: true});
          }
      }
      else {
          this.setGlobal({ user });
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

  createUser () {
      const displayName = this.state.displayName;
      this.sendRequest({
        info : { displayName },
        action: 'create',
        type: 'user'
      })
      .then(data=> {
        const user = data.info.user;
        cookies.set('displayName', displayName);
        cookies.set('userId', user.userId);
        cookies.set('userKey', user.userKey);
        this.setGlobal({ user });
        this.setState({userLoaded: true});
      });
  }

  render () {
    return (
        !this.state.userLoaded ? <Loading /> :
        this.global.user == null ? 
        <div className="preAuth">
          <label>Name:</label>
          <input type="text" onChange={ this.handleChange } name="displayName"></input>
          <button onClick={ this.create.bind(this) }>Go!</button>
        </div> :
        <div className="App">  
            {this.props.children}
        </div>
    )
 }

}


export default Auth;
