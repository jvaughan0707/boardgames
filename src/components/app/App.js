import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import Routes from '../routes/routes';
import io  from 'socket.io-client';
import Auth from '../auth/auth';

class App extends Component {
  constructor() {
    super();
    const	webSocket = io();
    webSocket.on('connect', () => {
      this.setGlobal({ webSocket });
    });

    this.setGlobal({ user: null, webSocket: null });
  }

  render () {
    return (
      <Auth>
          <Header />
          <Routes/> 
      </Auth>
    );
  }
};

export default App;
