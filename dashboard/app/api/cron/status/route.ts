import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { isAuthenticated } from "@/lib/auth";

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

const CronStatus = mongoose.models.CronStatus || mongoose.model('CronStatus', CronStatusSchema);

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    
    const status = await CronStatus.findOne({ _id: 'cron-status' });
    
    if (!status) {
      return NextResponse.json({
        isRunning: false,
        lastRun: null,
        nextRun: null,
        newAlerts: 0,
        emailsSent: 0,
        error: null,
        intervalMinutes: 15,
      });
    }

    return NextResponse.json({
      isRunning: status.isRunning,
      lastRun: status.lastRun,
      nextRun: status.nextRun,
      newAlerts: status.newAlerts,
      emailsSent: status.emailsSent,
      error: status.error,
      intervalMinutes: status.intervalMinutes,
    });
  } catch (error) {
    console.error("Error fetching cron status:", error);
    return NextResponse.json({ error: "Failed to fetch cron status" }, { status: 500 });
  }
}
