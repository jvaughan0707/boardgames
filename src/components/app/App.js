import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import Routes from '../routes/routes';
import WebSocketAsPromised from 'websocket-as-promised';
import Auth from '../auth/auth';

class App extends Component {
  constructor() {
    super();
    this.createWebSocket();
  }

  createWebSocket = () => {
    const URL = 'ws://localhost:3030';
    const	webSocket = new WebSocketAsPromised(URL, {
      packMessage: data => JSON.stringify(data),
      unpackMessage: data => JSON.parse(data),
      attachRequestId: (data, requestId) => Object.assign({id: requestId}, data), 
      extractRequestId: data => data && data.id,                               
    });
    webSocket.onClose.addListener(event => {
      console.log(`Connection closed: ${event.reason}`)
        this.createWebSocket();
    });

    webSocket.open().then(() => {
      console.log('connected');
      this.setGlobal({ webSocket });
    });

    

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
