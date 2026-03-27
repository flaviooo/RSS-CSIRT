import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { fetchAlerts } from "@/lib/rssService";
import { sendAlertEmail } from "@/lib/emailService";

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

const Alert = mongoose.models.Alert || mongoose.model("Alert", AlertSchema);

let isRunning = false;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRunning) {
    return NextResponse.json({ 
      message: "Already running", 
      status: "skipped" 
    });
  }

  isRunning = true;
  let newAlertsCount = 0;

  try {
    await connectDB();
    console.log("[Cron] Checking for new alerts...");
    
    const alerts = await fetchAlerts();
    
    if (alerts.length === 0) {
      console.log("[Cron] No alerts found in feed");
      return NextResponse.json({ 
        message: "No alerts in feed", 
        status: "ok",
        newAlerts: 0
      });
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
        console.log(`[Cron] Sent email for: ${alert.title}`);
      } catch (error) {
        console.error(`[Cron] Error sending email:`, error);
      }
    }

    console.log(`[Cron] Completed. New: ${newAlertsCount}, Emails sent: ${newAlerts.length}`);

    return NextResponse.json({ 
      message: "Cron job completed", 
      status: "ok",
      newAlerts: newAlertsCount,
      emailsSent: newAlerts.length
    });

  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json({ 
      error: "Cron job failed" 
    }, { status: 500 });
  } finally {
    isRunning = false;
  }
}
