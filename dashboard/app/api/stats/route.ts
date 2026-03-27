import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

const AlertSchema = new mongoose.Schema({
  rssId: String,
  title: String,
  link: String,
  description: String,
  pubDate: Date,
  severity: String,
  cveIds: [String],
  receivedAt: Date,
  sentViaEmail: Boolean,
  sentViaTelegram: Boolean,
  emailSentAt: Date,
});

const EmailLogSchema = new mongoose.Schema({
  alertId: String,
  alertTitle: String,
  sentAt: Date,
  recipient: String,
  status: String,
  error: String,
});

const Alert = mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema);

export async function GET(request: Request) {
  const authHeader = request.headers.get('cookie');
  const isAuthenticated = authHeader?.includes('auth=true');

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalAlerts,
      totalEmailsSent,
      emailsSentLast7Days,
      emailsSentLast30Days,
      alertsBySeverity,
      recentAlerts,
    ] = await Promise.all([
      Alert.countDocuments(),
      EmailLog.countDocuments({ status: "success" }),
      EmailLog.countDocuments({ status: "success", sentAt: { $gte: sevenDaysAgo } }),
      EmailLog.countDocuments({ status: "success", sentAt: { $gte: thirtyDaysAgo } }),
      Alert.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      Alert.find().sort({ receivedAt: -1 }).limit(10).lean(),
    ]);

    const severityMap: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    };

    alertsBySeverity.forEach((item: { _id: string; count: number }) => {
      if (severityMap.hasOwnProperty(item._id)) {
        severityMap[item._id] = item.count;
      }
    });

    return NextResponse.json({
      totalAlerts,
      totalEmailsSent,
      emailsSentLast7Days,
      emailsSentLast30Days,
      alertsBySeverity: severityMap,
      recentAlerts,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
