import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import { fetchPendingAlerts, formatPendingAlertMessage } from '../services/rssPendingService.js';
import { connectDB } from '../config/database.js';
import { PendingAlert } from '../models/PendingAlert.js';
import { User } from '../models/User.js';
import { sendAlertEmail } from '../services/emailService.js';

let isRunning = false;

export async function fetchAndSavePendingAlerts(): Promise<number> {
  if (isRunning) {
    console.log('Pending alert fetch already in progress, skipping...');
    return 0;
  }

  isRunning = true;
  let newAlertsCount = 0;

  try {
    await connectDB();
    console.log('Fetching and saving pending alerts...');
    
    const alerts = await fetchPendingAlerts();
    
    if (alerts.length === 0) {
      console.log('No alerts found in RSS feed');
      return 0;
    }

    for (const alert of alerts) {
      const existingAlert = await PendingAlert.findOne({ rssId: alert.id });
      
      if (!existingAlert) {
        const mongoAlert = new PendingAlert({
          rssId: alert.id,
          title: alert.title,
          link: alert.link,
          description: alert.description,
          pubDate: alert.pubDate,
          updatedAt: alert.updatedAt || null,
          severity: alert.severity,
          cveIds: alert.cveIds,
          status: 'pending',
          receivedAt: new Date(),
          evaluatedAt: null,
          evaluatedBy: null,
          sentViaEmail: false,
        });
        await mongoAlert.save();
        console.log(`Saved pending alert to MongoDB: ${alert.title}`);
        newAlertsCount++;
      }
    }

    console.log(`Saved ${newAlertsCount} new pending alerts`);

  } catch (error) {
    console.error('Error fetching pending alerts:', error);
  } finally {
    isRunning = false;
  }

  return newAlertsCount;
}

export async function sendApprovedAlerts(bot: TelegramBot): Promise<number> {
  try {
    await connectDB();
    
    const approvedAlerts = await PendingAlert.find({
      status: 'approved',
      sentViaEmail: false,
    });

    if (approvedAlerts.length === 0) {
      console.log('No approved alerts to send');
      return 0;
    }

    console.log(`Found ${approvedAlerts.length} approved alert(s) to send`);

    const subscribers = await User.find({ subscribed: true });
    
    let sentCount = 0;

    for (const alert of approvedAlerts) {
      try {
        const message = formatPendingAlertMessage({
          id: alert.rssId,
          title: alert.title,
          link: alert.link,
          description: alert.description,
          pubDate: alert.pubDate.toISOString(),
          updatedAt: alert.updatedAt?.toISOString(),
          severity: alert.severity,
          cveIds: alert.cveIds,
        });

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

        await sendAlertEmail({
          id: alert.rssId,
          title: alert.title,
          link: alert.link,
          description: alert.description,
          pubDate: alert.pubDate.toISOString(),
          updatedAt: alert.updatedAt?.toISOString(),
          severity: alert.severity,
          cveIds: alert.cveIds,
        }, alert._id.toString());

        await alert.updateOne({
          status: 'sent',
          sentViaEmail: true,
          emailSentAt: new Date(),
        });

        sentCount++;
      } catch (error) {
        console.error(`Error processing approved alert:`, error);
      }
    }

    console.log(`Sent ${sentCount} approved alerts`);
    return sentCount;

  } catch (error) {
    console.error('Error sending approved alerts:', error);
    return 0;
  }
}

export function startPendingAlertChecker(bot: TelegramBot): void {
  console.log('Starting pending alert checker (15-minute interval)...');
  
  cron.schedule('*/15 * * * *', async () => {
    await fetchAndSavePendingAlerts();
    await sendApprovedAlerts(bot);
  });

  console.log('Pending alert checker scheduled');
}

export async function runImmediatePendingCheck(bot: TelegramBot): Promise<{ saved: number; sent: number }> {
  const saved = await fetchAndSavePendingAlerts();
  const sent = await sendApprovedAlerts(bot);
  return { saved, sent };
}
