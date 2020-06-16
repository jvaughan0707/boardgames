import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import Home from "../home/home";
import Auth from '../auth/auth';
import { library } from '@fortawesome/fontawesome-svg-core'
import Overlay from '../overlay/overlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SkullRules from '../../game-components/skull/rules/rules';
import SpyfallRules from '../../game-components/spyfall/rules/rules';
import { faUser, faArrowRight, faUnlink, faCog, faQuestion, faSignOutAlt, faTimes, faUserSecret, faCheck, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons'
import Cookies from 'universal-cookie';
import knock from '../../resources/door-knock.ogg'
import Loading from '../loading/loading';
import io from 'socket.io-client';

library.add(faUser, faArrowRight, faUnlink, faCog, faQuestion, faSignOutAlt, faTimes, faUserSecret, faCheck, faVolumeMute, faVolumeUp)
const cookies = new Cookies();

class App extends Component {
  constructor() {
    super();
    this.state = { overlay: null, userValidated: false }
    this.setGlobal({ user: {displayName: cookies.get('displayName')}, webSocket: null, game: null, mute: cookies.get('mute') });
    this.connect();
  }

  quit = () => {
    if (this.global.game) {
      const ws = this.global.webSocket;
      ws.emit('quit', this.global.game.gameId);
    }
    this.setState({ overlay: null })
  }

  getRules = (type) => {
    switch (type) {
      case 'skull':
        return <SkullRules />
      case 'spyfall':
        return <SpyfallRules />
      default:
        return null;
    }
  }

  setCookie(key, value) {
    var expiry = new Date();
    expiry.setDate(99999);

    cookies.set(key, value, { path: '/', expires: new Date(expiry) });
  }

  connect() {
    const webSocket = io();
    webSocket.on('connect', () =>
      this.setGlobal({ webSocket })
    );

    webSocket.on('disconnect', () =>
      this.setGlobal({ webSocket })
    );

    webSocket.on('userValidated', this.onUserValidated);

    webSocket.on('knock', () => {
      if (!this.global.mute) {
        new Audio(knock).play();
      }
    });
  }

  onUserValidated = (user) => {
    this.setCookie('userId', user.userId);
    this.setCookie('userKey', user.userKey);

    if (this.global.user) {
      user.displayName = this.global.user.displayName;
    }

    this.setGlobal({ user });
    this.setState({ userValidated: true });
  }

  render() {

    return (
      this.state.userValidated ?

      <>
        <Header openLeaveGame={() => this.setState({ overlay: 'leaveGame' })}
          openRules={() => this.setState({ overlay: 'rules' })}
          hammer={this.hammer} />
        {
          this.state.overlay === 'leaveGame' &&
          <Overlay>
            <FontAwesomeIcon style={{ position: 'absolute', right: '15px', top: '15px' }}
              icon="times" onClick={() => this.setState({ overlay: null })} className="clickable" />
            <h2>Quit</h2>
            <p>Are you sure you want to quit this game?
              You wont be able to rejoin and it may impact the game for other players.</p>
            <div className="buttons">
              <button onClick={this.quit}>Yes</button>
              <button onClick={() => this.setState({ overlay: null })}>No</button>
            </div>
          </Overlay>
        }
        {
          this.state.overlay === 'rules' &&
          <Overlay>
            <FontAwesomeIcon style={{ position: 'absolute', right: '15px', top: '15px' }}
              icon="times" onClick={() => this.setState({ overlay: null })} className="clickable" />
            <h2>Rules</h2>
            {
              this.getRules(this.global.game.type)
            }
          </Overlay>
        }

        <Auth>
          <Home />
        </Auth>
      </> : 
        <Loading />
    );
  }
};

export default App;
