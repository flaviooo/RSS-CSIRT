import TelegramBot from 'node-telegram-bot-api';
import { getLastChecked } from '../services/stateService.js';

export function registerLastCheckCommand(bot: TelegramBot): void {
  bot.onText(/\/lastcheck/, (msg) => {
    const chatId = msg.chat.id;
    const lastChecked = getLastChecked();

    if (!lastChecked) {
      bot.sendMessage(chatId, 'No check has been performed yet.');
      return;
    }

    const date = new Date(lastChecked);
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
      `⏰ *Last Check:* ${formattedDate}\n⏳ ${timeAgo}`,
      { parse_mode: 'Markdown' }
    );
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
