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

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { intervalMinutes } = await request.json();
    
    if (!intervalMinutes || intervalMinutes < 1 || intervalMinutes > 1440) {
      return NextResponse.json({ error: "Invalid interval (1-1440)" }, { status: 400 });
    }

    await connectDB();

    await CronStatus.findOneAndUpdate(
      { _id: 'cron-status' },
      { intervalMinutes },
      { upsert: true }
    );

    return NextResponse.json({ success: true, intervalMinutes });
  } catch (error) {
    console.error("Error saving cron interval:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
