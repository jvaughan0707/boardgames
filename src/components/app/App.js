import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import Routes from '../routes/routes';
import Auth from '../auth/auth';

class App extends Component {
  constructor() {
    super();
    this.setGlobal({ user: null, webSocket: null });
  }

  render () {
    return (
      <Auth>
          <Header />
          <div className="page">
            <Routes/> 
          </div>
      </Auth>
    );
  }
};

export default App;
