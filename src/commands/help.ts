import TelegramBot from 'node-telegram-bot-api';

/**
 * Registra il comando /help per mostrare la lista dei comandi disponibili.
 * Organizza i comandi in categorie per una migliore leggibilità.
 */
export function registerHelpCommand(bot: TelegramBot): void {
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
Available Commands:
━━━━━━━━━━━━━━━━━━

🔰 Basic:
/start - Start the bot and see welcome message
/help - Show this help message
/menu - Show button menu

📊 CVE Alerts:
/alerts - View latest CVE alerts
/lastcheck - Show when last check occurred
/stats - Show your personal statistics
/cve <CVE-ID> - Search for a specific CVE (e.g., /cve CVE-2024-1234)

📧 Notifications:
/subscribe - Subscribe to alert notifications
/unsubscribe - Stop receiving notifications
/sendemail - Email via Dashboard
/sendmaillastmsg - Email via Dashboard

🔧 Utility:
/echo [text] - Echo your message back
    `.trim();

    bot.sendMessage(chatId, helpMessage);
  });
}
