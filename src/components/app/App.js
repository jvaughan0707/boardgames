import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import Routes from '../routes/routes';
import Auth from '../auth/auth';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faStar, faUser } from '@fortawesome/free-solid-svg-icons'

library.add(faStar, faUser)

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
