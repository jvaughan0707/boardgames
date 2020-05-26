const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Game',
    required: true
  },
  order: Number,
  public: Object,
  private: Object,
  internal: Object,
  active: Boolean
})

const PlayerState = mongoose.model('PlayerState', schema);
module.exports = PlayerState;