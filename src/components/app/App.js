import React, { useState, useEffect } from 'react';
import './App.css';
import Header from '../header/header';
import {getUser, createUser} from '../user/user'
import Routes from '../routes/routes';
import { useGlobal } from 'reactn';
import Loading from '../loading/loading'
import PreAuth from '../pre-auth/pre-auth'
import WebSocketAsPromised from 'websocket-as-promised';

const URL = 'ws://localhost:3030';

const App = () => {
  const [user, setUser] = useGlobal('user');
  const [userLoaded, setUserLoaded] = useState(false);
  const [, setWs] = useGlobal('ws');
  var wsRetryCount = 0;
  const wsMaxRetries = 10;

  useEffect(() => {
    if(!userLoaded) {
      getUser().then((u) => {
        setUser(u);
        setUserLoaded(true);
      })
      .catch((err) => {
        console.log(err);
      });
    }
    createWebSocket();
  }, []);

  var createWebSocket = () => {
    const	socket = new WebSocketAsPromised(URL, {
      packMessage: data => JSON.stringify(data),
      unpackMessage: data => JSON.parse(data),
      attachRequestId: (data, requestId) => Object.assign({id: requestId}, data), 
      extractRequestId: data => data && data.id,                               
    });

    socket.open().then(() => {
      console.log('connected');
      wsRetryCount = 0;
    });

    socket.onClose.addListener(event => {
      console.log(`Connection closed: ${event.reason}`)
      wsRetryCount++;
      if (wsRetryCount < wsMaxRetries) {
        createWebSocket();
      }
    });
    setWs(socket);
  }

  var submit = (displayName) => {
    createUser(displayName)
    .then((u) => { 
      setUser(u);
      setUserLoaded(true);
     });
  }

  return (
    !userLoaded ? <Loading /> :
      user == null ? 
       <PreAuth onSubmit={submit}/>:
      <div className="App">  
          <Header />
          <Routes/>
      </div>
     
    );
};

export default App;
