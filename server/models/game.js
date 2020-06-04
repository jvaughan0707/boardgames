const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  state: {
    public: Object,
    internal: Object
  },
  settings: Object,
  players: [
    {
      userId: String,
      displayName: String,
      state: {
        public: Object,
        private: Object,
        internal: Object,
      },
      active: Boolean
    }
  ],
  finsihed: Boolean
})

const Game = mongoose.model('Game', schema);
module.exports = Game;