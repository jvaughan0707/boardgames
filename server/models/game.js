const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    started: {type: Boolean, default: false},
    gameType: {type: String, required: true},
    title: {type: String, required: true},
    owner: {type: String, required: true},
    ownerId: {type: String, required: true},
    state: String,
    settings: String
})

const Game = mongoose.model('Game', schema);
module.exports = Game;