import React from 'react';

export default function Rules() {
  return (<>
    <p>Each player plays a face-down card, then each player in turn adds one more card
    until someone wagers a number of cards that they can turn face up and get only roses.</p>
    <p>Other players can then overbid them, saying they can turn even more cards face up.
    The highest bidder must then turn that number of cards face up, starting with their own.
    If they reveal only roses, they win a point. If they reveal a skull, they lose one of their cards.</p>
    <p>The next round begins with the highest bidder of the previous round 
    (or the player to their left if they have no cards left)</p>
    <p>Two successful challenges wins the game.</p>
  </>)
}