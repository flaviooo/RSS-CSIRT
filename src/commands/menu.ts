import TelegramBot from 'node-telegram-bot-api';
import { Alert } from '../models/Alert.js';
import { EmailLog } from '../models/EmailLog.js';
import { User } from '../models/User.js';

// Regex per validare il formato CVE
const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/i;

// Emoji per livelli di severità
const severityEmoji: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  unknown: '⚪',
};

/**
 * Registra il comando /menu con tastiera inline.
 * Include tutti i comandi principali come bottoni.
 */
export function registerMenuCommand(bot: TelegramBot): void {
  // Invia il menu con la tastiera inline
  bot.onText(/\/menu/, (msg) => {
    const chatId = msg.chat.id;

    const menuMessage = '📋 Main Menu\n\nSelect an option:';

    const options: TelegramBot.SendMessageOptions = {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [
            { text: '🔔 Latest Alerts' },
            { text: '🔕 Subscribe' },
          ],
          [
            { text: '🔇 Unsubscribe' },
            { text: '📅 Last Check' },
          ],
          [
            { text: '🔍 Search CVE' },
          ],
          [
            { text: '📊 My Stats' },
            { text: '📧 Send Email' },
          ],
          [
            { text: '❓ Help' },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };

    bot.sendMessage(chatId, menuMessage, options);
  });

  // Gestisce i click sui bottoni del menu
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    // 🔔 Latest Alerts - Mostra gli ultimi 5 alert da MongoDB
    if (text === '🔔 Latest Alerts') {
      const { connectDB } = await import('../config/database.js');
      const { Alert } = await import('../models/Alert.js');
      await connectDB();
      const alerts = await Alert.find({}).sort({ pubDate: -1 }).limit(5);
      if (alerts.length === 0) {
        bot.sendMessage(chatId, 'No alerts found in database.');
      } else {
        const severityEmoji: Record<string, string> = {
          critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', unknown: '⚪',
        };
        for (const alert of alerts) {
          const emoji = severityEmoji[alert.severity || 'unknown'];
          const severityLabel = (alert.severity || 'unknown').toUpperCase();
          const date = new Date(alert.pubDate).toLocaleString('it-IT');
          let message = `${emoji} **${severityLabel}**\n\n`;
          message += `📌 ${alert.title}\n`;
          message += `⏰ ${date}\n`;
          if (alert.cveIds && alert.cveIds.length > 0) {
            message += `🔢 CVEs: ${alert.cveIds.join(', ')}\n`;
          }
          message += `\n🔗 ${alert.link}`;
          bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
    } else if (text === '🔕 Subscribe') {
      bot.sendMessage(chatId, 'Use /subscribe to receive CVE alert notifications!');
    } else if (text === '🔇 Unsubscribe') {
      bot.sendMessage(chatId, 'Use /unsubscribe to stop receiving CVE alerts.');
    } else if (text === '📅 Last Check') {
      const { connectDB } = await import('../config/database.js');
      const { Alert } = await import('../models/Alert.js');
      await connectDB();
      const latestAlert = await Alert.findOne({}).sort({ receivedAt: -1 });
      const response = latestAlert
        ? `📅 Last alert received: ${new Date(latestAlert.receivedAt).toLocaleString()}`
        : 'No alerts in database yet.';
      bot.sendMessage(chatId, response);
    } else if (text === '📊 My Stats') {
      // 📊 My Stats - Mostra statistiche personali dell'utente
      try {
        const user = await User.findOne({ chatId: chatId.toString() });
        const isSubscribed = user?.subscribed ?? true;

        const alertsCount = await Alert.countDocuments({
          sentViaTelegram: true,
        });

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
    } else if (text === '🔍 Search CVE') {
      // 🔍 Search CVE - Cerca CVE specifica o mostra CVE recenti
      bot.sendMessage(
        chatId,
        '🔍 *Search CVE*\n\nInserisci il CVE da cercare.\n\nFormato: `CVE-YYYY-NNNNN`\nEsempio: `CVE-2024-1234`\n\noppure clicca su un CVE recente:',
        { parse_mode: 'Markdown' }
      );
      
      try {
        // Recupera CVE recenti dal database per mostrarli come bottoni
        const recentCves = await Alert.find({ 'cveIds.0': { $exists: true } })
          .sort({ receivedAt: -1 })
          .limit(10)
          .select('cveIds title severity')
          .lean();

        // Estrae CVE unici (max 5) per evitare duplicati
        const uniqueCves = new Map<string, { title: string; severity: string }>();
        for (const alert of recentCves) {
          for (const cve of alert.cveIds) {
            if (!uniqueCves.has(cve)) {
              uniqueCves.set(cve, { title: alert.title, severity: alert.severity });
            }
            if (uniqueCves.size >= 5) break;
          }
          if (uniqueCves.size >= 5) break;
        }

        // Mostra CVE recenti come bottoni cliccabili
        if (uniqueCves.size > 0) {
          const cveButtons: TelegramBot.KeyboardButton[] = [];
          for (const [cve] of uniqueCves) {
            cveButtons.push({ text: cve });
          }

          bot.sendMessage(chatId, 'CVE recenti:', {
            reply_markup: {
              keyboard: [cveButtons, [{ text: '🔙 Back to Menu' }]],
              resize_keyboard: true,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching recent CVEs:', error);
      }
    } else if (text.startsWith('CVE-') && CVE_REGEX.test(text)) {
      // CVE specifico - Mostra dettagli del CVE cliccato
      const normalizedCveId = text.toUpperCase();
      
      try {
        const alert = await Alert.findOne({ cveIds: normalizedCveId });

        if (!alert) {
          bot.sendMessage(
            chatId,
            `🔍 *CVE Not Found*\n\nNo alerts found for \`${normalizedCveId}\` in our database.`,
            { parse_mode: 'Markdown' }
          );
        } else {
          const emoji = severityEmoji[alert.severity] || '⚪';
          const severityLabel = alert.severity.toUpperCase();

          const date = new Date(alert.pubDate).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          let message = `${emoji} *${severityLabel}*\n\n`;
          message += `📌 ${alert.title}\n`;
          message += `⏰ ${date}\n`;
          message += `🔢 ${normalizedCveId}\n\n`;

          if (alert.description) {
            const shortDesc = alert.description.length > 300
              ? alert.description.slice(0, 300) + '...'
              : alert.description;
            message += `📝 ${shortDesc}\n\n`;
          }

          message += `🔗 ${alert.link}`;

          bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }
      } catch (error) {
        console.error('Error searching CVE:', error);
        bot.sendMessage(chatId, '❌ Error searching for CVE. Please try again later.');
      }

      // Mostra bottone per tornare al menu
      bot.sendMessage(chatId, '📋 Click to return to menu:', {
        reply_markup: {
          keyboard: [[{ text: '🔙 Back to Menu' }]],
          resize_keyboard: true,
        },
      });
    } else if (text === '🔙 Back to Menu') {
      const menuMessage = '📋 Main Menu\n\nSelect an option:';
      const options: TelegramBot.SendMessageOptions = {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [
              { text: '🔔 Latest Alerts' },
              { text: '🔕 Subscribe' },
            ],
            [
              { text: '🔇 Unsubscribe' },
              { text: '📅 Last Check' },
            ],
            [
              { text: '🔍 Search CVE' },
            ],
            [
              { text: '📊 My Stats' },
              { text: '📧 Send Email' },
            ],
            [
              { text: '❓ Help' },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      };
      bot.sendMessage(chatId, menuMessage, options);
    } else if (text === '📧 Send Email') {
      bot.sendMessage(
        chatId, 
        '📧 La funzionalità di invio email è stata spostata sulla Dashboard.\n\n' +
        'Puoi inviare email dalla dashboard: ' + (process.env.DASHBOARD_URL || 'http://localhost:3006')
      );
    } else if (text === '❓ Help') {
      bot.sendMessage(chatId, 'Use /help for the full command list.');
    }
  });
}
