require('dotenv').config();
require('./server/mongo');

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("./client/build"));

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, "client/build")})
})

const port = process.env.PORT

var http = require( "http" ).createServer( app );
require('./server/socket')(http);

http.listen(port, () => console.log("Listening on port " + port));

const job = require('./server/cron');

job.start();