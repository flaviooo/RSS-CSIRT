import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import { fetchAlerts, formatAlertMessage } from '../services/rssService.js';
import { sendAlertEmail } from '../services/emailService.js';
import { connectDB } from '../config/database.js';
import { Alert as AlertModel } from '../models/Alert.js';
import { User } from '../models/User.js';

// Flag per evitare esecuzioni concurrenti
let isRunning = false;

/**
 * Verifica la presenza di nuovi alert nel feed RSS.
 * Salva i nuovi alert in MongoDB e notifica i sottoscrittori.
 * @returns Numero di nuovi alert processati
 */
export async function checkForNewAlerts(bot: TelegramBot): Promise<number> {
  // Previene esecuzioni concurrenti
  if (isRunning) {
    console.log('Alert check already in progress, skipping...');
    return 0;
  }

  isRunning = true;
  let newAlertsCount = 0;

  try {
    await connectDB();
    console.log('Checking for new alerts...');
    
    // Recupera alert dal feed RSS
    const alerts = await fetchAlerts();
    
    if (alerts.length === 0) {
      console.log('No alerts found in feed');
      return 0;
    }

    // Salva i nuovi alert in MongoDB (se non esistono già)
    for (const alert of alerts) {
      const existingAlert = await AlertModel.findOne({ rssId: alert.id });
      
      if (!existingAlert) {
        const mongoAlert = new AlertModel({
          rssId: alert.id,
          title: alert.title,
          link: alert.link,
          description: alert.description,
          pubDate: new Date(alert.pubDate),
          updatedAt: alert.updatedAt ? new Date(alert.updatedAt) : null,
          severity: alert.severity,
          cveIds: alert.cveIds,
          receivedAt: new Date(),
          sentViaEmail: false,
          sentViaTelegram: false,
        });
        await mongoAlert.save();
        console.log(`Saved new alert to MongoDB: ${alert.title}`);
      }
    }

    // Recupera l'ultimo alert salvato
    const latestAlert = alerts[0];
    const latestMongoAlert = await AlertModel.findOne({ rssId: latestAlert.id });
    
    if (!latestMongoAlert) {
      return 0;
    }

    // Recupera utenti sottoscritti
    const subscribers = await User.find({ subscribed: true });
    
    if (subscribers.length === 0) {
      console.log('No subscribers found');
      return 0;
    }

    // Trova alert non ancora inviati via Telegram
    const newAlerts = await AlertModel.find({
      rssId: { $in: alerts.map(a => a.id) },
      sentViaTelegram: false,
    });

    if (newAlerts.length === 0) {
      console.log('No new alerts to send');
      return 0;
    }

    console.log(`Found ${newAlerts.length} new alert(s)`);

    // Invia ogni nuovo alert a tutti i sottoscrittori
    for (const alert of newAlerts) {
      try {
        const message = formatAlertMessage(alert);
        
        // Invia a ogni sottoscrittore
        for (const subscriber of subscribers) {
          try {
            await bot.sendMessage(subscriber.chatId, message, {
              parse_mode: 'Markdown',
            });
            // Pausa tra messaggi per evitare rate limit
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error sending alert to ${subscriber.chatId}:`, error);
          }
        }

        // Segna come inviato e invia email
        await alert.updateOne({ sentViaTelegram: true });
        await sendAlertEmail(alert, alert._id.toString());
        
        newAlertsCount++;
      } catch (error) {
        console.error(`Error processing alert:`, error);
      }
    }

    console.log(`Processed ${newAlertsCount} new alerts`);

  } catch (error) {
    console.error('Error checking for new alerts:', error);
  } finally {
    isRunning = false;
  }

  return newAlertsCount;
}

/**
 * Avvia il job cron per verificare nuovi alert ogni 30 minuti.
 */
export function startAlertChecker(bot: TelegramBot): void {
  console.log('Starting alert checker with 30-minute interval...');
  
  // Schedule: ogni 30 minuti (*/30 * * * *)
  cron.schedule('*/30 * * * *', async () => {
    await checkForNewAlerts(bot);
  });

  console.log('Alert checker scheduled');
}

/**
 * Esegue una verifica immediata degli alert (es. all'avvio del bot).
 */
export async function runImmediateCheck(bot: TelegramBot): Promise<number> {
  return await checkForNewAlerts(bot);
}
