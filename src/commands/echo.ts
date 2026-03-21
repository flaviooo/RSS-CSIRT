import TelegramBot from 'node-telegram-bot-api';

export function registerEchoCommand(bot: TelegramBot): void {
  bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    
    if (!match) {
      bot.sendMessage(chatId, 'Usage: /echo [text]');
      return;
    }

    const echoedText = match[1];
    bot.sendMessage(chatId, `You said: ${echoedText}`);
  });

  bot.onText(/\/echo/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Usage: /echo [text]\nExample: /echo Hello World!');
  });
}
