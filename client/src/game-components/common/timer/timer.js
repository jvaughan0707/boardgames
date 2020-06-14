import React, { Component } from "react";
import './timer.css';

class Timer extends Component {
  constructor(props) {
    super();
    this.state = { remainingTime: this.getRemainingTime(props) }
  }
  componentDidMount() {
    this.timeout = setInterval(() => {
      console.log('tick');
      this.setState({ remainingTime: Math.min(this.getRemainingTime(this.props), this.state.remainingTime) });
    }, 1000);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  getRemainingTime = (props) => {
    var remaining = props.paused ? props.length : Math.max(props.length + (new Date(props.from) - new Date()), 0);
    if (remaining === 0) {
      if (typeof (props.onTimerEnd) === 'function') {
        props.onTimerEnd();
      }
    }
    return remaining;
  }

  render() {
    return (
      <div className={`${this.props.paused ? 'paused' : ''} timer`}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="none">
            <circle className="path-elapsed" cx="50" cy="50" r="45"></circle>
            <path
              className="path-remaining"
              strokeDasharray={`${this.state.remainingTime / this.props.initial * 283} 283`}
              d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0"></path>
          </g>
        </svg>
        <span className="timer-label">
          {Math.floor(this.state.remainingTime / 1000 / 60)}:{Math.floor((this.state.remainingTime / 1000) % 60).toString().padStart(2, '0')}
        </span>
      </div>)
  }
}

export default Timer