import TelegramBot from 'node-telegram-bot-api';
import { connectDB } from '../config/database.js';
import { Alert } from '../models/Alert.js';

export function registerLastCheckCommand(bot: TelegramBot): void {
  bot.onText(/\/lastcheck/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      await connectDB();
      const latestAlert = await Alert.findOne({}).sort({ receivedAt: -1 });

      if (!latestAlert) {
        bot.sendMessage(chatId, 'No alerts in database yet.');
        return;
      }

      const date = new Date(latestAlert.receivedAt);
      const formattedDate = date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const timeAgo = getTimeAgo(date);

      bot.sendMessage(
        chatId,
        `⏰ *Last Alert:* ${formattedDate}\n⏳ ${timeAgo}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error getting last check:', error);
      bot.sendMessage(chatId, 'Error retrieving last check time.');
    }
  });
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute(s) ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour(s) ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day(s) ago`;
}
