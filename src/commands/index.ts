import TelegramBot from 'node-telegram-bot-api';
import { registerStartCommand } from './start.js';
import { registerHelpCommand } from './help.js';
import { registerEchoCommand } from './echo.js';
import { registerSubscribeCommand } from './subscribe.js';
import { registerLastCheckCommand } from './lastcheck.js';
import { registerMenuCommand } from './menu.js';
import { registerSendEmailCommand } from './sendemail.js';
import { registerSendMailLastMsgCommand } from './sendmaillastmsg.js';
import { registerStatsCommand } from './stats.js';
import { registerCveCommand } from './cve.js';

export function registerCommands(bot: TelegramBot): void {
  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerEchoCommand(bot);
  registerSubscribeCommand(bot);
  registerLastCheckCommand(bot);
  registerMenuCommand(bot);
  registerSendEmailCommand(bot);
  registerSendMailLastMsgCommand(bot);
  registerStatsCommand(bot);
  registerCveCommand(bot);
}
