import React from 'react';
import './tile.css';

export default function Card(props) {

  var className = `tile ${props.className || ''} ${props.click ? 'clickable' : ''} ${props.animated ? 'animated' : ''}`;
  var imgStyle = { boxShadow: props.rotateX ? `0px 5px 0px ${props.colour || 'black'}` : 'none' };
  return (
    <div onClick={props.click} className={className}
    style={{ left: `${props.posX || 0}%`, top: `${props.posY || 0}%`, zIndex: props.zIndex }}>
      <div className='tile-x-plane' style={{ transform: `rotateX(${props.rotateX || 0}deg)` }}>
        <div className='tile-y-plane' style={{ transform: `rotateY(${props.rotateY || 0}deg)` }}>
          <div className={`tile-front tile-image ${props.frontImgClass}`} style={imgStyle}>
            {
              props.frontImg &&
              <img src={props.frontImg} alt="card front" />
            }
          </div>
          <div className={`tile-back tile-image ${props.backImgClass || ''}`} style={imgStyle}>
            {
              props.backImg &&
              <img src={props.backImg} alt="card back" />
            }
          </div>
        </div>
      </div>
    </div>
  )
}