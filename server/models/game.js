const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    started: {type: Boolean, default: false},
    type: {type: String, required: true},
    title: {type: String, required: true},
    ownerId: {
		type: mongoose.Schema.ObjectId,
        ref: 'User', 
        required: true},
    state: { 
        public: Object,
        internal: Object
    },
    settings: Object
})

const Game = mongoose.model('Game', schema);
module.exports = Game;