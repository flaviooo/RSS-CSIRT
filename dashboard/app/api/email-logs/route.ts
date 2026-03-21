import { NextResponse } from "next/server";
import mongoose from "mongoose";

const EmailLogSchema = new mongoose.Schema({
  alertId: String,
  alertTitle: String,
  sentAt: Date,
  recipient: String,
  status: String,
  error: String,
});

const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cve-bot");

    const query: Record<string, unknown> = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const [logs, total] = await Promise.all([
      EmailLog.find(query).sort({ sentAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      EmailLog.countDocuments(query),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
