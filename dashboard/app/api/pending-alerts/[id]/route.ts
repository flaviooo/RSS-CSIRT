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

const EmailLogSchema = new mongoose.Schema({
  alertId: String,
  alertTitle: String,
  sentAt: Date,
  recipient: String,
  status: String,
  error: String,
});

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
    const { action } = await request.json();
    
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cve-bot");

    const alert = await PendingAlert.findById(id);
    
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (action === "reject") {
      await alert.updateOne({
        status: "outofftopic",
        evaluatedAt: new Date(),
        evaluatedBy: "admin",
      });
      return NextResponse.json({ success: true, message: "Alert rejected (outofftopic)" });
    }

    if (action === "approve") {
      await alert.updateOne({
        status: "approved",
        evaluatedAt: new Date(),
        evaluatedBy: "admin",
      });
      return NextResponse.json({ success: true, message: "Alert approved" });
    }

    if (action === "send-email") {
      const recipient = process.env.EMAIL_TO || process.env.MAIL_GMAIL_USER || "";
      
      let emailStatus = "success";
      let emailError: string | null = null;

      try {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAIL_GMAIL_USER,
            pass: process.env.MAIL_GMAIL_TOKEN,
          },
        });

        const mailOptions = {
          from: process.env.MAIL_GMAIL_USER,
          to: recipient,
          subject: `[${alert.severity.toUpperCase()}] CVE Alert: ${alert.title}`,
          text: `${alert.title}\n\nSeverity: ${alert.severity}\nDate: ${alert.pubDate}\nLink: ${alert.link}\n\nDescription:\n${alert.description}`,
        };

        await transporter.sendMail(mailOptions);
      } catch (error) {
        emailStatus = "failed";
        emailError = error instanceof Error ? error.message : "Unknown error";
        console.error("Error sending email:", error);
      }

      const emailLog = new EmailLog({
        alertId: alert._id.toString(),
        alertTitle: alert.title,
        sentAt: new Date(),
        recipient,
        status: emailStatus,
        error: emailError,
      });
      await emailLog.save();

      if (emailStatus === "success") {
        await alert.updateOne({
          sentViaEmail: true,
          emailSentAt: new Date(),
        });
      }

      return NextResponse.json({
        success: emailStatus === "success",
        message: emailStatus === "success" ? "Email sent successfully" : "Email failed",
        log: {
          status: emailStatus,
          recipient,
          error: emailError,
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing pending alert action:", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cve-bot");

    const alert = await PendingAlert.findById(id).lean();
    
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error fetching pending alert:", error);
    return NextResponse.json({ error: "Failed to fetch alert" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cve-bot");

    const alert = await PendingAlert.findByIdAndDelete(id);
    
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Alert deleted" });
  } catch (error) {
    console.error("Error deleting pending alert:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
