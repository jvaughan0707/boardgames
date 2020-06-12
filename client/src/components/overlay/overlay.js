import React from 'react';
import './overlay.css';

export default function Overlay(props) {
  return (
    <div className={`overlay ${props.fade? 'fade' : ''}`} style={{zIndex: props.zIndex || 100}}>
      <div className="dialog centered" style={{width: `${props.width}px`, height: `${props.height}px`}}>
        {
          props.children
        }
      </div>
    </div>
  );
}