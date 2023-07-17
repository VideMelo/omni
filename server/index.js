// By VideMelo: https://github.com/videmelo :p
require('dotenv').config();

const Bot = require('./source/services/Bot.js');
const client = new Bot();

client.build();

module.exports = client;
