// By VideMelo: https://github.com/videmelo :p
import 'dotenv/config'; // TypeScript-friendly import

import Bot from './core/Bot.js';
const client = new Bot();

client.login();

export default client;
