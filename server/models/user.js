const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    key: String
})

const User = mongoose.model('User', schema);
module.exports = User;