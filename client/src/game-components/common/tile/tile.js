import React from 'react';
import './tile.css';

export default function Card(props) {

  var className = `tile ${props.className} ${props.click ? 'clickable' : ''} ${props.animated ? 'animated' : ''}`;
  return (
    <div onClick={props.click} className={className}
      style={{ transform: `translate(${props.posX || 0}%, ${props.posY || 0}%)`, zIndex: props.zIndex }}>
      <div className='tile-x-plane'  style={{transform: `rotateX(${props.rotateX || 0}deg)`}}>
        <div className='tile-y-plane' style={{transform: `rotateY(${props.rotateY || 0}deg)`}}>
          {props.frontImg &&
            <div className="tile-front">
              <img src={props.frontImg} alt="front" style={{ boxShadow: props.rotateX ? `0px 5px 0px ${props.colour}` : 'none' }} />
            </div>
          }
          <div className="tile-back">
            <img src={props.backImg} alt="back" style={{ boxShadow: props.rotateX ? `0px 5px 0px ${props.colour}` : 'none' }} />
          </div>
        </div>
      </div>
    </div>
  )
}