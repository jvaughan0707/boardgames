import React, { useState, useEffect } from 'react';
import './App.css';
import Header from '../header/header';
import {getUser, createUser} from '../user/user'
import Routes from '../routes/routes';
import { useGlobal } from 'reactn';
import Loading from '../loading/loading'
const URL = 'ws://localhost:3030';

const App = () => {
  const [user, setUser] = useGlobal('user');
  const [userLoaded, setUserLoaded] = useState(false);
  const [, setWs] = useGlobal('ws');
  var wsRetryCount = 0;
  const wsMaxRetries = 10;
  var displayName = '';

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
    const	socket = new WebSocket(URL)
    socket.onopen = () => {
      console.log('connected');
      wsRetryCount = 0;
    }

    socket.onmessage = evt => {
      const message = JSON.parse(evt.data)
      console.log(message + ' recieved in App.js')
    }

    socket.onclose = () => {
      console.log('disconnected')
      // automatically try to reconnect on connection loss
      wsRetryCount++;
      if (wsRetryCount < wsMaxRetries) {
        createWebSocket();
      }
    }
    setWs(socket);
  }

  var submit = () => {
    createUser(displayName)
    .then((u) => { 
      setUser(u);
      setUserLoaded(true);
     });
  }

  var handleChange = event => {
    displayName =  event.target.value;
  }

  return (
    !userLoaded ? <Loading /> :
      user == null ? 
      <div className="preAuth">
        <label>Name:</label>
        <input type="text" onChange={handleChange} name="displayName"></input>
        <button onClick={ submit }>Go!</button>
      </div> :
      <div className="App">  
          <Header />
          <Routes/>
      </div>
     
    );
};

export default App;
