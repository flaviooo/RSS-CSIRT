import TelegramBot from 'node-telegram-bot-api';
import { connectDB } from '../config/database.js';
import { Alert } from '../models/Alert.js';

function formatAlertMessage(alert: { title: string; severity?: string; pubDate: Date; link: string; cveIds: string[] }): string {
  const severityEmoji: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    unknown: '⚪',
  };

  const emoji = severityEmoji[alert.severity || 'unknown'];
  const severityLabel = (alert.severity || 'unknown').toUpperCase();
  const date = new Date(alert.pubDate).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `${emoji} **${severityLabel}**\n\n`;
  message += `📌 ${alert.title}\n`;
  message += `⏰ ${date}\n`;
  
  if (alert.cveIds && alert.cveIds.length > 0) {
    message += `🔢 CVEs: ${alert.cveIds.join(', ')}\n`;
  }
  
  message += `\n🔗 ${alert.link}`;

  return message;
}

export function registerAlertsCommand(bot: TelegramBot): void {
  bot.onText(/\/alerts/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      await connectDB();
      
      const alerts = await Alert.find({}).sort({ pubDate: -1 }).limit(5);
      
      if (alerts.length === 0) {
        bot.sendMessage(chatId, 'No alerts found. The dashboard may not have fetched any alerts yet.');
        return;
      }

      let header = `📊 *Latest ${alerts.length} Alerts*\n\n`;
      header += '━━━━━━━━━━━━━━━━━━\n\n';

      await bot.sendMessage(chatId, header, { parse_mode: 'Markdown' });

      for (const alert of alerts) {
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
