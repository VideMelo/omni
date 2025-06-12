import colors from 'colors';

export default class Logger {
   static info(text: string) {
      console.log(colors.green('[INFO]'), text);
   }

   static warn(text: string) {
      console.log(colors.yellow('[WARN]'), text);
   }

   static error(text: string, error: string = '') {
      console.error(colors.red('[ERRO]'), text, error);
   }

   static async(text: string) {
      console.log(colors.magenta('[ASYN]'), text);
   }

   static done(text: string) {
      console.log(colors.blue('[DONE]'), text);
   }

   static test(text: string) {
      console.log(colors.yellow('[TEST]'), text);
   }
}
