import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import { connectDB } from '../config/database.js';
import { Alert as AlertModel } from '../models/Alert.js';
import { User } from '../models/User.js';

let isRunning = false;

function formatAlertMessage(alert: { title: string; severity?: string; pubDate: Date; link: string; cveIds: string[] }): string {
  const severityEmoji: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    unknown: '⚪',
  };

  const emoji = severityEmoji[alert.severity || 'unknown'];
  const severityLabel = (alert.severity || 'unknown').toUpperCase();
  const date = new Date(alert.pubDate).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `${emoji} **${severityLabel}**\n\n`;
  message += `📌 ${alert.title}\n`;
  message += `⏰ ${date}\n`;
  
  if (alert.cveIds && alert.cveIds.length > 0) {
    message += `🔢 CVEs: ${alert.cveIds.join(', ')}\n`;
  }
  
  message += `\n🔗 ${alert.link}`;

  return message;
}

export async function checkForNewAlerts(bot: TelegramBot): Promise<number> {
  if (isRunning) {
    console.log('Alert check already in progress, skipping...');
    return 0;
  }

  isRunning = true;
  let newAlertsCount = 0;

  try {
    await connectDB();
    console.log('Checking for new alerts in MongoDB...');
    
    const subscribers = await User.find({ subscribed: true });
    
    if (subscribers.length === 0) {
      console.log('No subscribers found');
      return 0;
    }

    const newAlerts = await AlertModel.find({
      sentViaTelegram: false,
    }).sort({ pubDate: -1 }).limit(10);

    if (newAlerts.length === 0) {
      console.log('No new alerts to send via Telegram');
      return 0;
    }

    console.log(`Found ${newAlerts.length} new alert(s) to send via Telegram`);

    for (const alert of newAlerts) {
      try {
        const message = formatAlertMessage(alert);
        
        for (const subscriber of subscribers) {
          try {
            await bot.sendMessage(subscriber.chatId, message, {
              parse_mode: 'Markdown',
            });
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error sending alert to ${subscriber.chatId}:`, error);
          }
        }

        await alert.updateOne({ sentViaTelegram: true });
        
        newAlertsCount++;
      } catch (error) {
        console.error(`Error processing alert:`, error);
      }
    }

    console.log(`Processed ${newAlertsCount} new alerts via Telegram`);

  } catch (error) {
    console.error('Error checking for new alerts:', error);
  } finally {
    isRunning = false;
  }

  return newAlertsCount;
}

export function startAlertChecker(bot: TelegramBot): void {
  console.log('Starting alert checker - reads from MongoDB, sends Telegram only...');
  
  cron.schedule('*/15 * * * *', async () => {
    await checkForNewAlerts(bot);
  });

  console.log('Alert checker scheduled (Telegram only)');
}

export async function runImmediateCheck(bot: TelegramBot): Promise<number> {
  return await checkForNewAlerts(bot);
}
