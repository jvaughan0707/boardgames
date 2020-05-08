const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    started: {type: Boolean, default: false},
    type: {type: String, required: true},
    title: {type: String, required: true},
    ownerId: {
		type: mongoose.Schema.ObjectId,
        ref: 'User', 
        required: true},
    state: String,
    settings: String
})

const Game = mongoose.model('Game', schema);
module.exports = Game;