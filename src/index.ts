import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { registerCommands } from './commands/index.js';
import { registerListeners } from './listeners/index.js';
import { startAlertChecker, runImmediateCheck } from './jobs/alertChecker.js';
// import { startPendingAlertChecker, runImmediatePendingCheck } from './jobs/pendingAlertChecker.js';

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, {
  polling: true,
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('Unexpected error:', error);
});

registerCommands(bot);
registerListeners(bot);

// Original alert system (automatic notifications)
startAlertChecker(bot);
setTimeout(async () => {
  console.log('Running initial alert check...');
  await runImmediateCheck(bot);
}, 3000);

// Pending alert system (moderation workflow)
// To enable: uncomment lines below and import startPendingAlertChecker, runImmediatePendingCheck
// startPendingAlertChecker(bot);
// setTimeout(async () => {
//   console.log('Running initial pending alert check...');
//   await runImmediatePendingCheck(bot);
// }, 5000);

console.log('Bot is running...');
