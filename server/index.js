// By VideMelo: https://github.com/videmelo :p
require('dotenv').config();

const Bot = require('./source/Omni.js');
const client = new Bot();

client.login();

process.on('uncaughtException', (err) => {
   if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
      console.log('Stream fechado prematuramente (operacional)');
   } else {
      throw console.error(err);
   }
});

module.exports = client;
