import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { connectDB } from './mongodb';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_GMAIL_USER,
    pass: process.env.MAIL_GMAIL_TOKEN,
  },
});

const EmailLogSchema = new mongoose.Schema({
  alertId: String,
  alertTitle: String,
  sentAt: Date,
  recipient: String,
  status: String,
  error: String,
});

const EmailLog = mongoose.models.EmailLog || mongoose.model('EmailLog', EmailLogSchema);

export interface AlertForEmail {
  _id?: string;
  id?: string;
  title: string;
  link: string;
  description?: string;
  severity?: string;
  pubDate: Date | string;
}

export async function sendAlertEmail(alert: AlertForEmail, mongoAlertId?: string): Promise<boolean> {
  const subject = `[${alert.severity?.toUpperCase() || 'UNKNOWN'}] CVE Alert: ${alert.title}`;
  const text = `${alert.title}\n\nSeverity: ${alert.severity}\nDate: ${alert.pubDate}\nLink: ${alert.link}\n\nDescription:\n${alert.description || 'N/A'}`;

  const recipient = process.env.EMAIL_TO || process.env.MAIL_GMAIL_USER || '';

  const mailOptions = {
    from: process.env.MAIL_GMAIL_USER,
    to: recipient,
    subject,
    text,
  };

  let emailStatus: 'success' | 'failed' = 'success';
  let emailError: string | null = null;

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent for alert: ${alert.title}`);
  } catch (error) {
    emailStatus = 'failed';
    emailError = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending email:', error);
  }

  try {
    await connectDB();

    const emailLog = new EmailLog({
      alertId: mongoAlertId || alert._id || alert.id || '',
      alertTitle: alert.title,
      sentAt: new Date(),
      recipient,
      status: emailStatus,
      error: emailError,
    });
    await emailLog.save();
  } catch (dbError) {
    console.error('Error logging email to MongoDB:', dbError);
  }

  return emailStatus === 'success';
}

export async function sendEmail(params: { subject: string; text: string }): Promise<boolean> {
  const recipient = process.env.EMAIL_TO || process.env.MAIL_GMAIL_USER || '';

  const mailOptions = {
    from: process.env.MAIL_GMAIL_USER,
    to: recipient,
    subject: params.subject,
    text: params.text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
