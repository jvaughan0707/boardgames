require('dotenv').config();
require('./mongo');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("./build"));

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, "..", "build")})
})

const port = process.env.port
app.listen(port, () => console.log("Listening on port " + port));

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: __dirname})
})

const port = process.env.port
app.listen(port, () => console.log("Listening on port " + port));