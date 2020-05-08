const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    playerId: {
		type: mongoose.Schema.ObjectId,
        ref: 'User', 
        required: true},
    gameId: {
		type: mongoose.Schema.ObjectId,
        ref: 'Game', 
        required: true},
    public: String,
    private: String
})

const PlayerState = mongoose.model('PlayerState', schema);
module.exports = PlayerState;