const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  players: [
    {
      userId: String,
      displayName: String,
    }
  ],
  minPlayers: Number,
  maxPlayers: Number,
  settings: Object
})

const Lobby = mongoose.model('Lobby', schema);
module.exports = Lobby;