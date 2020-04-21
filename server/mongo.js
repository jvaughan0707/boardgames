const mongoose = require('mongoose');
const env = require('./environment/environment');

mongoose.Promise = global.Promise;

const mongoUri = `mongodb://${env.dbName}:${env.key}@${env.dbName}.mongo.cosmos.azure.com:${env.port}/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@${env.dbName}@`

function connect () {
    return mongoose.connect(mongoUri, { useNewUrlParser: true,  useUnifiedTopology: true})
    .catch(err => { 
        console.log(err, mongoUri); 
    });
}

module.exports = {
    connect,
    mongoose
}