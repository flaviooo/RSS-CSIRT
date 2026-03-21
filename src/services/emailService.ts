import nodemailer from 'nodemailer';
import { Alert } from '../types/alert.js';
import { connectDB } from '../config/database.js';
import { Alert as AlertModel } from '../models/Alert.js';
import { EmailLog } from '../models/EmailLog.js';

// Configurazione transporter SMTP per Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,  // Usa STARTTLS (porta 587)
  auth: {
    user: process.env.MAIL_GMAIL_USER,
    pass: process.env.MAIL_GMAIL_TOKEN,
  },
});

/**
 * Invia un'email con i dettagli di un alert CVE.
 * Registra l'esito in MongoDB (EmailLog) e aggiorna lo stato dell'alert.
 * @param alert - Alert da inviare
 * @param mongoAlertId - ID MongoDB dell'alert (opzionale)
 * @returns true se l'invio ha avuto successo
 */
export async function sendAlertEmail(alert: Alert, mongoAlertId?: string): Promise<boolean> {
  // Costruisce oggetto email con subject e body
  const subject = `[${alert.severity?.toUpperCase()}] CVE Alert: ${alert.title}`;
  const text = `${alert.title}\n\nSeverity: ${alert.severity}\nDate: ${alert.pubDate}\nLink: ${alert.link}\n\nDescription:\n${alert.description}`;

  // Destinatario: EMAIL_TO se configurato, altrimenti MAIL_GMAIL_USER
  const recipient = process.env.EMAIL_TO || process.env.MAIL_GMAIL_USER || '';

  const mailOptions = {
    from: process.env.MAIL_GMAIL_USER,
    to: recipient,
    subject,
    text,
  };

  let emailStatus: 'success' | 'failed' = 'success';
  let emailError: string | null = null;

  // Tentativo di invio email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent for alert: ${alert.id}`);
  } catch (error) {
    emailStatus = 'failed';
    emailError = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending email:', error);
  }

  // Registra l'esito in MongoDB
  try {
    await connectDB();

    const emailLog = new EmailLog({
      alertId: mongoAlertId || alert.id,
      alertTitle: alert.title,
      sentAt: new Date(),
      recipient,
      status: emailStatus,
      error: emailError,
    });
    await emailLog.save();

    // Aggiorna lo stato dell'alert se l'invio è riuscito
    if (mongoAlertId && emailStatus === 'success') {
      await AlertModel.findByIdAndUpdate(mongoAlertId, {
        sentViaEmail: true,
        emailSentAt: new Date(),
      });
    }
  } catch (dbError) {
    console.error('Error logging email to MongoDB:', dbError);
  }

  return emailStatus === 'success';
}

/**
 * Invia un'email generica con subject e body custom.
 * Non registra l'esito in MongoDB.
 * @param params - Oggetto con subject e text
 * @returns true se l'invio ha avuto successo
 */
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
