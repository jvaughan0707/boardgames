import React, { Component } from "react";
import './timer.css';

class Timer extends Component {
  constructor(props) {
    super();
    this.state = { remainingTime: this.getRemainingTime(props) }
  }

  startTimer() {
    var remaining = this.getRemainingTime(this.props);

    this.timeout = setTimeout(
      () => {
        this.setState({ remainingTime: Math.min(this.getRemainingTime(this.props), this.state.remainingTime) });
        this.interval = setInterval(() => {
          this.setState({ remainingTime: Math.min(this.getRemainingTime(this.props), this.state.remainingTime) });
        }, 1000);
      },
      remaining % 1000);
  }

  componentDidMount() {
    this.startTimer();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.paused && this.props.paused) {
      clearTimeout(this.timeout);
      clearInterval(this.interval);
    }

    if (prevProps.paused && !this.props.paused) {
      this.startTimer();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
  }

  getRemainingTime = (props) => {
    var remaining = props.paused ? props.length : Math.max(props.length + (new Date(props.from) - new Date()), 0);
    if (remaining === 0) {
      if (typeof (props.onTimerEnd) === 'function') {
        props.onTimerEnd();
        clearInterval(this.interval);
      }
    }
    return remaining;
  }

  render() {
    var remainingSeconds = Math.round(this.state.remainingTime / 1000);
    return (
      <div className={`${this.props.paused || this.state.remainingTime === 0 ? 'paused' : ''} timer`}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="none">
            <circle className="path-elapsed" cx="50" cy="50" r="45"></circle>
            <path
              className="path-remaining"
              strokeDasharray={`${Math.max(this.props.paused ? this.state.remainingTime : this.state.remainingTime - 1000, 0) / this.props.initial * 283} 283`}
              d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0"></path>
          </g>
        </svg>
        <span className="timer-label">
          {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
        </span>
      </div>)
  }
}

export default Timer