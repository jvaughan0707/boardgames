const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    displayName: String,
    key: String
})

const User = mongoose.model('User', schema);
module.exports = User;