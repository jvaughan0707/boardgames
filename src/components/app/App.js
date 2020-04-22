import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import {getUser, createUser} from '../user/user'
import Routes from '../routes/routes';
import Loading from '../loading/loading'
import PreAuth from '../pre-auth/pre-auth'
import WebSocketAsPromised from 'websocket-as-promised';


class App extends Component {

  constructor() {
    super ();
    this.state = {userLoaded: false};
  }

  componentWillMount() {
    if(!this.state.userLoaded) {
      getUser().then((user) => {
        this.setGlobal({user});
        this.setState({userLoaded: true});
      })
      .catch((err) => {
        console.log(err);
      });
    }
    this.createWebSocket();
  }

   createWebSocket = () => {
    const URL = 'ws://localhost:3030';
    const	socket = new WebSocketAsPromised(URL, {
      packMessage: data => JSON.stringify(data),
      unpackMessage: data => JSON.parse(data),
      attachRequestId: (data, requestId) => Object.assign({id: requestId}, data), 
      extractRequestId: data => data && data.id,                               
    });

    socket.open().then(() => {
      console.log('connected');
    });

    socket.onClose.addListener(event => {
      console.log(`Connection closed: ${event.reason}`)
        this.createWebSocket();
    });

    this.setGlobal({ws: socket});
  }

  submit = (displayName) => {
    createUser(displayName)
    .then((user) => { 
      this.setGlobal({user});
      this.setState({userLoaded: true});
     });
  }

  render () {
    return (
    !this.state.userLoaded ? <Loading /> :
      this.global.user == null ? 
       <PreAuth onSubmit={this.submit}/>:
      <div className="App">  
          <Header />
          <Routes/>
      </div>
    );
  }
};

export default App;
