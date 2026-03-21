import TelegramBot from 'node-telegram-bot-api';
import { Alert } from '../models/Alert.js';

// Regex per validare il formato CVE: CVE-ANNO-NUMERO (min 4 cifre)
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
 * Registra il comando /cve per cercare dettagli di una CVE specifica.
 * Formato: /cve <CVE-ID> (es. /cve CVE-2024-1234)
 */
export function registerCveCommand(bot: TelegramBot): void {
  // Gestisce /cve con argomento
  bot.onText(/\/cve\s+(.+)/i, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const cveId = match?.[1]?.trim();

    // Verifica che sia stato fornito un CVE ID
    if (!cveId) {
      bot.sendMessage(chatId, 'Usage: /cve <CVE-ID>\nExample: /cve CVE-2024-1234');
      return;
    }

    // Normalizza il CVE ID in maiuscolo
    const normalizedCveId = cveId.toUpperCase();

    // Valida il formato del CVE ID
    if (!CVE_REGEX.test(normalizedCveId)) {
      bot.sendMessage(
        chatId,
        '❌ Invalid CVE format.\nPlease use: /cve CVE-YYYY-NNNNN\nExample: /cve CVE-2024-1234'
      );
      return;
    }

    try {
      // Cerca l'alert contenente il CVE ID specificato
      const alert = await Alert.findOne({ cveIds: normalizedCveId });

      // Se non trovato, mostra messaggio informativo
      if (!alert) {
        bot.sendMessage(
          chatId,
          `🔍 *CVE Not Found*\n\nNo alerts found for \`${normalizedCveId}\` in our database.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Costruisce il messaggio con i dettagli dell'alert
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

      // Aggiunge la descrizione se presente (limitata a 300 caratteri)
      if (alert.description) {
        const shortDesc = alert.description.length > 300
          ? alert.description.slice(0, 300) + '...'
          : alert.description;
        message += `📝 ${shortDesc}\n\n`;
      }

      // Aggiunge il link all'advisory
      message += `🔗 ${alert.link}`;

      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching CVE:', error);
      bot.sendMessage(chatId, '❌ Error searching for CVE. Please try again later.');
    }
  });

  // Gestisce /cve senza argomento
  bot.onText(/\/cve$/, (msg) => {
    const chatId = msg.chat.id.toString();
    bot.sendMessage(chatId, 'Usage: /cve <CVE-ID>\nExample: /cve CVE-2024-1234');
  });
}
