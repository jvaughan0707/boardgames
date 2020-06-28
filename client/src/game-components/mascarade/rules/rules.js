import React from 'react';

export default function Rules() {
  return (<>
    <p>On your turn you can:</p>
    <ul>
      <li>Swap (or not) - take your card and another card and secretly either swap - or not - before returning the cards.</li>
      <li>Inspect you card.</li>
      <li>Announce your character - other players can claim to also be the claimed character. If any other players have claimed, all of the claimants reveal their cards and the ones who are correct get to use that character's power. Any incorrect players pay a fine of one coin to the courthouse.</li>
    </ul>
    <p>If any player reaches 13 coins they win the game. If any player goes bankrupt, the game ends and the richest player wins.</p>
  </>)
}