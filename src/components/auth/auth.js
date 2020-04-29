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

    if (displayName) {
      this.getUser();
    }
  }

  handleChange = event => {
    this.setState({displayName: event.target.value });
  }

  getUser () {
      const displayName = this.state.displayName;
      this.sendRequest({
        info : { displayName },
        action: 'validate',
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
          <button onClick={ this.getUser.bind(this) }>Go!</button>
        </div> :
        <div className="App">  
            {this.props.children}
        </div>
    )
 }

}


export default Auth;
