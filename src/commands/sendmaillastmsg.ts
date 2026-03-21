import TelegramBot from 'node-telegram-bot-api';
import { fetchLatestAlert } from '../services/rssService.js';
import { sendAlertEmail } from '../services/emailService.js';

export function registerSendMailLastMsgCommand(bot: TelegramBot): void {
  bot.onText(/\/sendmaillastmsg/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, '📧 Sending last alert via email...');

      const alert = await fetchLatestAlert();

      if (!alert) {
        await bot.sendMessage(chatId, 'No alerts found.');
        return;
      }

      const success = await sendAlertEmail(alert);

      if (success) {
        await bot.sendMessage(chatId, `✅ Email inviata con l'ultimo alert!\n\n📌 ${alert.title}`);
      } else {
        await bot.sendMessage(chatId, '❌ Error sending email.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      await bot.sendMessage(chatId, '❌ Error sending email. Check logs.');
    }
  });
}
