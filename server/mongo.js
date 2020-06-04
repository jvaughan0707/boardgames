const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI

mongoose.connect(
  mongoUri,
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log("Connected to database"))
.catch(err => console.error(err, mongoUri));
