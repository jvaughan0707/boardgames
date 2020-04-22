import React from 'react';

const PreAuth = ({onSubmit}) => { 
  var displayName = '';

  var handleChange = event => {
    displayName =  event.target.value;
  }

return (
    <div className="preAuth">
        <label>Name:</label>
        <input type="text" onChange={handleChange} name="displayName"></input>
        <button onClick={ () => onSubmit(displayName) }>Go!</button>
    </div>)
}


export default PreAuth;
