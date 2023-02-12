const colors = require('colors');

class Logger {
   info(text) {
      console.log(colors.green('[INFO]'), text);
   }

   warn(text) {
      console.log(colors.yellow('[WARN]'), text);
   }

   erro(text, erro = '') {
      console.error(colors.red('[ERRO]'), text, erro);
   }

   async(text) {
      console.log(colors.magenta('[ASYN]'), text);
   }

   done(text) {
      console.log(colors.blue('[DONE]'), text);
   }

   test(text) {
      console.log(colors.yellow('[TEST]'), text);
   }
}


module.exports = Logger;
