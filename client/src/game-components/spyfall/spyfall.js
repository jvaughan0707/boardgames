import React, { Component } from 'reactn';
import './spyfall.css';
import Timer from '../common/timer/timer';
import Finish from './finish/finish';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import locationsImg from '../../resources/spyfall/locations.jpg';

class Spyfall extends Component {
  constructor(props) {
    super(props);
    this.state = { updating: false, selectedLocationId: null }
  }

  sendMove = (type, data) => {
    if (!this.state.updating) {
      this.global.webSocket.emit("gameAction", this.global.game.gameId, type, data, error => console.log(error));
    }
  }

  render() {
    var game = this.global.game;
    var userIndex = game.players.findIndex(p => p.userId === this.global.user.userId);
    var user = game.players[userIndex];
    var spy = user.state.spy;
    var locations = game.state.locations;

    return (
      <>
        {
          game.finished &&
          <Finish />
        }
        <div id="spyfall-container">
          <div id="players">
            {
              game.players.map(p => (
                <div key={p.userId} className={`${p.state.spy ? 'spy' : ''} player`}>
                  <div className="player-inner">
                    <h3>{p.displayName}</h3>
                    {
                      p !== user &&
                      <button title="You can only do this once per round"
                        onClick={() => this.sendMove("nominate", p.userId)}
                        disabled={!user.state.canNominate || game.state.paused || game.state.nominatedPlayer}>Nominate</button>
                    }
                    <div className="accusations">
                      {
                        p.state.accusers.map(a =>
                          <FontAwesomeIcon key={a.userId} icon="user-secret" title={`Accused by ${a.displayName}`} />)
                      }
                    </div>
                  </div>
                </div>)
              )
            }
          </div>
          <div id="info">
            <Timer paused={game.state.paused} initial={game.state.totalTime} length={game.state.timerLength} from={game.state.timerFrom}
              onTimerEnd={() => {
                if (!game.finished && !game.state.nominatedPlayer) {
                  game.state.nominatedPlayer = game.players[0];
                  this.setGlobal({ game });
                }
              }} />
            <div>Secret location: <span className="nowrap">{spy ? 'Unknown' : locations[user.state.locationId]}</span></div>
            <div>Your role: {spy ? 'Spy' : user.state.role}</div>
            <div>Objective:
              {
                spy ? 'Stay hidden and try to work out the location before time runs out!' :
                  `Find the ${game.state.spyCount > 1 ? 'spies' : 'spy'} without giving away the location!`
              }</div>
            {
              spy && <div>
                Selected location: <span className="nowrap">{this.state.selectedLocationId ? locations[this.state.selectedLocationId] : 'None'}</span>
                <br />
                <button title="You can only do this once per round"
                  onClick={() => this.sendMove("guessLocation", this.state.selectedLocationId)}
                  disabled={game.state.paused || !this.state.selectedLocationId}>Submit guess</button>
              </div>
            }
            {
              game.state.nominatedPlayer &&
              <div>
                Nominated: {game.state.nominatedPlayer.displayName}
                <br />
                <div className="votes">
                  Votes:
                {game.players.map((p, i) => p.userId === game.state.nominatedPlayer.userId ?
                  null :
                  <FontAwesomeIcon icon={p.state.vote === null ? "question" : p.state.vote ? "check" : "times"} title={p.displayName} key={i} />
                )}
                </div>
                <button onClick={() => this.sendMove("vote", true)}
                  disabled={user.state.vote !== null ||
                    (game.state.nominatedPlayer && game.state.nominatedPlayer.userId === user.userId)}>
                  <FontAwesomeIcon icon="check" />
                </button>
                <button onClick={() => this.sendMove("vote", false)}
                  disabled={user.state.vote !== null ||
                    (game.state.nominatedPlayer && game.state.nominatedPlayer.userId === user.userId)}>
                  <FontAwesomeIcon icon="times" />
                </button>
                <div>({game.players.length - game.state.spyCount} needed to convict)</div>
              </div>
            }
          </div>
          <div id="locations">
            {
              Object.keys(locations).map(id => {
                var className = 'location ';

                if (spy) {
                  className += 'clickable ';

                  if (id === this.state.selectedLocationId) {
                    className += 'selected ';
                  }
                }
                else if (id === user.state.locationId) {
                  className += 'selected ';
                }

                return (
                  <div key={id} style={{ background: `url(${locationsImg}) 0 ${(1 - id)*170}px/100%` }}
                    alt={locations[id]} className={className}
                    onClick={spy ? () => this.setState({ selectedLocationId: id }) : null}>
                    {
                      game.players.filter(p => p.state.locationGuess === id)
                        .map(() => <FontAwesomeIcon icon="user-secret" />)
                    }
                  </div>
                )
              })
            }
          </div>
        </div>
      </>
    )
  }
}

export default Spyfall