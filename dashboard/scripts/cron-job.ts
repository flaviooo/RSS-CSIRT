import 'dotenv/config';
import cron from 'node-cron';
import mongoose from 'mongoose';
import { fetchAlerts } from '../lib/rssService';
import { sendAlertEmail } from '../lib/emailService';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cve-bot';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_MINUTES || '15');

const AlertSchema = new mongoose.Schema({
  rssId: String,
  title: String,
  link: String,
  description: String,
  pubDate: Date,
  updatedAt: Date,
  severity: String,
  cveIds: [String],
  receivedAt: Date,
  sentViaEmail: Boolean,
  sentViaTelegram: Boolean,
  emailSentAt: Date,
});

const CronStatusSchema = new mongoose.Schema({
  _id: { type: String, default: 'cron-status' },
  lastRun: Date,
  nextRun: Date,
  isRunning: Boolean,
  newAlerts: Number,
  emailsSent: Number,
  error: String,
  intervalMinutes: Number,
}, { _id: false });

const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
const CronStatus = mongoose.models.CronStatus || mongoose.model('CronStatus', CronStatusSchema);

let isRunning = false;

async function updateStatus(running: boolean, newAlerts = 0, emailsSent = 0, error: string | null = null) {
  const now = new Date();
  const nextRun = new Date(now.getTime() + CHECK_INTERVAL * 60 * 1000);
  
  await CronStatus.findOneAndUpdate(
    { _id: 'cron-status' },
    {
      lastRun: running ? new Date() : undefined,
      nextRun,
      isRunning: running,
      newAlerts: running ? undefined : newAlerts,
      emailsSent: running ? undefined : emailsSent,
      error,
      intervalMinutes: CHECK_INTERVAL,
    },
    { upsert: true, runValidators: false }
  );
}

async function checkForNewAlerts() {
  if (isRunning) {
    console.log('[Cron] Already running, skipping...');
    return;
  }

  isRunning = true;
  let newAlertsCount = 0;
  let emailsSentCount = 0;
  let errorMessage: string | null = null;

  try {
    await updateStatus(true);
    console.log('[Cron] Checking for new alerts...');
    
    const alerts = await fetchAlerts();
    
    if (alerts.length === 0) {
      console.log('[Cron] No alerts found in feed');
      await updateStatus(false, 0, 0, null);
      return;
    }

    for (const alert of alerts) {
      const existingAlert = await Alert.findOne({ rssId: alert.id });
      
      if (!existingAlert) {
        const mongoAlert = new Alert({
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
        console.log(`[Cron] Saved new alert: ${alert.title}`);
        newAlertsCount++;
      }
    }

    const newAlerts = await Alert.find({
      rssId: { $in: alerts.map(a => a.id) },
      sentViaEmail: false,
    });

    for (const alert of newAlerts) {
      try {
        await sendAlertEmail(alert, alert._id.toString());
        alert.sentViaEmail = true;
        alert.emailSentAt = new Date();
        await alert.save();
        emailsSentCount++;
        console.log(`[Cron] Sent email for: ${alert.title}`);
      } catch (emailError) {
        console.error(`[Cron] Error sending email:`, emailError);
      }
    }

    console.log(`[Cron] Completed. New: ${newAlertsCount}, Emails sent: ${emailsSentCount}`);
    await updateStatus(false, newAlertsCount, emailsSentCount, null);

  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron] Error:', error);
    await updateStatus(false, newAlertsCount, emailsSentCount, errorMessage);
  } finally {
    isRunning = false;
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('[Cron] Connected to MongoDB');
  
  console.log(`[Cron] Starting cron job every ${CHECK_INTERVAL} minutes...`);
  
  await updateStatus(false, 0, 0, null);
  
  cron.schedule(`*/${CHECK_INTERVAL} * * * *`, checkForNewAlerts);
  
  await checkForNewAlerts();
}

main().catch(console.error);
