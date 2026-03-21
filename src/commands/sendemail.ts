import TelegramBot from 'node-telegram-bot-api';
import { fetchAlerts } from '../services/rssService.js';
import { sendAlertEmail } from '../services/emailService.js';

export function registerSendEmailCommand(bot: TelegramBot): void {
  bot.onText(/\/sendemail/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, '📧 Sending latest alerts via email...');

      const alerts = await fetchAlerts();

      if (alerts.length === 0) {
        await bot.sendMessage(chatId, 'No alerts to send.');
        return;
      }

      let sentCount = 0;
      for (const alert of alerts.slice(0, 5)) {
        const success = await sendAlertEmail(alert);
        if (success) sentCount++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await bot.sendMessage(chatId, `✅ Email inviata con ${sentCount} alert(s)!`);
    } catch (error) {
      console.error('Error sending email:', error);
      await bot.sendMessage(chatId, '❌ Error sending email. Check logs.');
    }
  });
}
