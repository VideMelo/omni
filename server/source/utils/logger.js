const colors = require('colors');

class Logger {
   static info(text) {
      console.log(colors.green('[INFO]'), text);
   }

   static warn(text) {
      console.log(colors.yellow('[WARN]'), text);
   }

   static erro(text, erro = '') {
      console.error(colors.red('[ERRO]'), text, erro);
   }

   static async(text) {
      console.log(colors.magenta('[ASYN]'), text);
   }

   static done(text) {
      console.log(colors.blue('[DONE]'), text);
   }

   static test(text) {
      console.log(colors.yellow('[TEST]'), text);
   }
}

module.exports = Logger;
