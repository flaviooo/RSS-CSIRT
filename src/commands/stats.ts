import TelegramBot from 'node-telegram-bot-api';
import { Alert } from '../models/Alert.js';
import { EmailLog } from '../models/EmailLog.js';
import { User } from '../models/User.js';

/**
 * Registra il comando /stats per mostrare le statistiche personali dell'utente.
 * Visualizza: numero di alert ricevuti, email inviate e stato sottoscrizione.
 */
export function registerStatsCommand(bot: TelegramBot): void {
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id.toString();

    try {
      // Recupera lo stato di sottoscrizione dell'utente
      const user = await User.findOne({ chatId });
      const isSubscribed = user?.subscribed ?? true;

      // Conta gli alert inviati via Telegram
      const alertsCount = await Alert.countDocuments({
        sentViaTelegram: true,
      });

      // Conta le email inviate con successo
      const emailLogs = await EmailLog.countDocuments({
        status: 'success',
      });

      const message = `
📊 *Your Stats*

📨 Alerts received: ${alertsCount}
📧 Emails sent: ${emailLogs}
📋 Subscription: ${isSubscribed ? '✅ Active' : '❌ Inactive'}
      `.trim();

      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching stats:', error);
      bot.sendMessage(chatId, '❌ Error fetching stats. Please try again later.');
    }
  });
}
