import TelegramBot from 'node-telegram-bot-api';

export function registerSendEmailCommand(bot: TelegramBot): void {
  bot.onText(/\/sendemail/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(
      chatId, 
      '📧 La funzionalità di invio email è stata spostata sulla Dashboard.\n\n' +
      'Puoi inviare email degli alert dalla dashboard: ' +
      process.env.DASHBOARD_URL || 'http://localhost:3006'
    );
  });
}
