const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    playerId: String,
    gameId: String,
    state: String
})

const PlayerState = mongoose.model('PlayerState', schema);
module.exports = PlayerState;