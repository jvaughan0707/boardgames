import React, { Component } from 'reactn';
import './App.css';
import Header from '../header/header';
import Home from "../home/home";
import Auth from '../auth/auth';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUser, faArrowRight, faUnlink, faCog, faQuestion, faSignOutAlt, faTimes, faUserSecret, faCheck } from '@fortawesome/free-solid-svg-icons'
import Overlay from '../overlay/overlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SkullRules from '../../game-components/skull/rules/rules';
import SpyfallRules from '../../game-components/spyfall/rules/rules';

library.add(faUser, faArrowRight, faUnlink, faCog, faQuestion, faSignOutAlt, faTimes, faUserSecret, faCheck)

class App extends Component {
  constructor() {
    super();
    this.state = { overlay: null }
    this.setGlobal({ user: null, webSocket: null, game: null });
  }

  quit = () => {
    if (this.global.game) {
      const ws = this.global.webSocket;
      ws.emit('quit', this.global.game.gameId);
    }
    this.setState({ overlay: null })
  }

  getRules = (type ) => {
    switch (type) {
      case 'skull':
        return <SkullRules/>
        case 'spyfall':
          return <SpyfallRules/>
      default:
        return null;
    }
  }

  render() {
    return (
      <>
        <Header openLeaveGame={() => this.setState({ overlay: 'leaveGame' })}
          openRules={() => this.setState({ overlay: 'rules' })} />
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
      </>
    );
  }
};

export default App;
