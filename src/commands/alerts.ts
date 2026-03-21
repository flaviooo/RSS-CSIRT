import TelegramBot from 'node-telegram-bot-api';
import { fetchAlerts, formatAlertMessage } from '../services/rssService.js';
import { getLastChecked } from '../services/stateService.js';

export function registerAlertsCommand(bot: TelegramBot): void {
  bot.onText(/\/alerts/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const alerts = await fetchAlerts();
      
      if (alerts.length === 0) {
        bot.sendMessage(chatId, 'No alerts found in the feed.');
        return;
      }

      const lastChecked = getLastChecked();
      let header = `📊 *Latest ${Math.min(5, alerts.length)} Alerts*\n\n`;
      
      if (lastChecked) {
        const checkedDate = new Date(lastChecked).toLocaleString('it-IT');
        header += `Last check: ${checkedDate}\n\n`;
      }
      
      header += '━━━━━━━━━━━━━━━━━━\n\n';

      await bot.sendMessage(chatId, header, { parse_mode: 'Markdown' });

      const limitedAlerts = alerts.slice(0, 5);
      
      for (const alert of limitedAlerts) {
        const message = formatAlertMessage(alert);
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        await new Promise(resolve => setTimeout(resolve, 300));
      }

    } catch (error) {
      console.error('Error fetching alerts:', error);
      bot.sendMessage(chatId, 'Error fetching alerts. Please try again later.');
    }
  });
}
