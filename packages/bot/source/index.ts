// By VideMelo: https://github.com/videmelo :p
import 'dotenv/config';

import Bot from './core/Bot.js';
import Logger from './utils/logger.js';
const client = new Bot();

process.on('uncaughtException', (err: any) => {
   if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
   Logger.error(`Uncaught Exception:`, err);
});

client.login();

export default client;
