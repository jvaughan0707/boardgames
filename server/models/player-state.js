const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    playerId: String,
    gameId: String,
    public: String,
    private: String
})

const PlayerState = mongoose.model('PlayerState', schema);
module.exports = PlayerState;