import TelegramBot from 'node-telegram-bot-api';

export function registerListeners(bot: TelegramBot): void {
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    if (text.startsWith('/')) {
      return;
    }

    console.log(`Message from ${msg.from?.first_name} (${chatId}): ${text}`);

    bot.sendMessage(chatId, 'Ciao! Per vedere i comandi disponibili, usa /help', {
      parse_mode: 'Markdown',
    });
  });

  bot.on('callback_query', (query) => {
    console.log(`Callback query from ${query.from.id}: ${query.data}`);
  });

  bot.on('inline_query', (query) => {
    console.log(`Inline query from ${query.from.id}: ${query.query}`);
  });
}
