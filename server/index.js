// By VideMelo: https://github.com/videmelo :p
require('dotenv').config();

const Bot = require('./source/Omni.js');
const client = new Bot();

client.login();

module.exports = client;
