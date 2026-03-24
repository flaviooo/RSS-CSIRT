import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { isAuthenticated } from "@/lib/auth";

const PendingAlertSchema = new mongoose.Schema({
  rssId: String,
  title: String,
  link: String,
  description: String,
  pubDate: Date,
  updatedAt: Date,
  severity: String,
  cveIds: [String],
  status: String,
  receivedAt: Date,
  evaluatedAt: Date,
  evaluatedBy: String,
  sentViaEmail: Boolean,
  emailSentAt: Date,
});

const PendingAlert = mongoose.models.PendingAlert || mongoose.model("PendingAlert", PendingAlertSchema);

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const search = searchParams.get("search");
    const cve = searchParams.get("cve");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cve-bot");

    const query: Record<string, unknown> = {};
    
    if (status && status !== "all") {
      query.status = status;
    }
    
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
      PendingAlert.find(query).sort({ receivedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PendingAlert.countDocuments(query),
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
    console.error("Error fetching pending alerts:", error);
    return NextResponse.json({ error: "Failed to fetch pending alerts" }, { status: 500 });
  }
}
