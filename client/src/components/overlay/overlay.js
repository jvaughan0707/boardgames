import React from 'react';
import './overlay.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Overlay(props) {
  return (
    <div className={`overlay ${props.fade ? 'fade' : ''}`} style={{ zIndex: props.zIndex || 100 }}>

      <div className="dialog centered" style={{ width: `${props.width}px`, height: `${props.height}px` }}>
        {
          props.close && <FontAwesomeIcon style={{ position: 'absolute', right: '15px', top: '15px' }}
            icon="times"
            className="clickable"
            onClick={props.close} />
        }
        <div className="dialog-content">
          {
            props.children
          }
        </div>
      </div>
    </div>
  );
}