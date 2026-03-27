import { NextResponse } from "next/server";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { isAuthenticated } from "@/lib/auth";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const alert = await Alert.findById(id);
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_GMAIL_USER,
        pass: process.env.MAIL_GMAIL_TOKEN,
      },
    });

    const subject = `[${alert.severity?.toUpperCase()}] CVE Alert: ${alert.title}`;
    const text = `${alert.title}\n\nSeverity: ${alert.severity}\nDate: ${alert.pubDate}\nLink: ${alert.link}\n\nDescription:\n${alert.description}`;

    const recipient = process.env.EMAIL_TO || process.env.MAIL_GMAIL_USER;

    let emailStatus = "success";
    let emailError: string | null = null;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_GMAIL_USER,
        to: recipient,
        subject,
        text,
      });
    } catch (err) {
      emailStatus = "failed";
      emailError = err instanceof Error ? err.message : "Unknown error";
    }

    const emailLog = new EmailLog({
      alertId: alert._id,
      alertTitle: alert.title,
      sentAt: new Date(),
      recipient,
      status: emailStatus,
      error: emailError,
    });
    await emailLog.save();

    if (emailStatus === "success") {
      alert.sentViaEmail = true;
      alert.emailSentAt = new Date();
      await alert.save();
    }

    return NextResponse.json({
      success: emailStatus === "success",
      message: emailStatus === "success" ? "Email sent successfully" : emailError,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
