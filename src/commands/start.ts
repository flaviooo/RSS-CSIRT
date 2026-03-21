import TelegramBot from 'node-telegram-bot-api';

export function registerStartCommand(bot: TelegramBot): void {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
Welcome to CVE OpenFetch Bot! 🔍

I can help you search and fetch CVE information.

Available commands:
/start - Show this welcome message
/help - List all available commands
/alerts - Get the latest CVE alerts
/lastcheck - Show recent CVE checks
/echo [text] - Echo your message back
/stats - Show your personal statistics
/cve <CVE-ID> - Search for a specific CVE (e.g., /cve CVE-2024-1234)

Stay tuned for more features!
    `.trim();

    bot.sendMessage(chatId, welcomeMessage);
  });
}
