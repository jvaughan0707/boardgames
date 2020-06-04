const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const mongoUri = process.env.mongoUri

function connect () {
    return mongoose.connect(mongoUri, { useNewUrlParser: true,  useUnifiedTopology: true })
    .catch(err => { 
        console.log(err, mongoUri); 
    });
}

module.exports = {
    connect,
    mongoose
}