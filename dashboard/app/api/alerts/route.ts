import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { isAuthenticated } from "@/lib/auth";

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

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const search = searchParams.get("search");
    const cve = searchParams.get("cve");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cve-bot");

    const query: Record<string, unknown> = {};
    
    if (severity && severity !== "all") {
      query.severity = severity;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    
    if (cve) {
      query.cveIds = { $regex: cve, $options: "i" };
    }

    const [alerts, total] = await Promise.all([
      Alert.find(query).sort({ pubDate: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Alert.countDocuments(query),
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
