import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import Routes from '../routes/routes';
import Auth from '../auth/auth';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faStar, faUser, faArrowRight, faLink, faUnlink, faCog } from '@fortawesome/free-solid-svg-icons'

library.add(faStar, faUser, faArrowRight, faLink, faUnlink, faCog)

class App extends Component {
  constructor() {
    super();
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
