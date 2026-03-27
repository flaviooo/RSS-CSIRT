import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { isAuthenticated } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await connectDB();

    const result = await Alert.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Alert deleted" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
