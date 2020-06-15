import React from 'react';

export default function Rules() {
  return (
    <ul>
      <li>1 or 2 spies per game.</li>
      <li>Spies do not know the location.</li>
      <li>Take turns asking one question to another player.</li>
      <li>Person who just answered asks the next question (no ask-backs)</li>
      <li>Spies can stop the game while the timer is running by guessing the location
      (if there is a 2nd spy they will also guess at this point).</li>
      <li>Once per game each player can accuse another player of being a spy.
      This pauses the timer and all players vote on whether they agree.
      A conviction requires at least as many votes as non-spies in the game.</li>
      <li>If a player is unanimously convicted the game ends.</li>
      <li>If the timer runs out there will be a round of voting for each player.</li>
    </ul>
  )
}