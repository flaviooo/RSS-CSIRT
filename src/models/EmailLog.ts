import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interfaccia per il documento EmailLog in MongoDB.
 * Tiene traccia di tutti gli invii email per debugging e statistiche.
 */
export interface IEmailLog extends Document {
  alertId: string;            // ID dell'alert inviato
  alertTitle: string;          // Titolo dell'alert (per riferimento)
  sentAt: Date;               // Data/ora tentativo invio
  recipient: string;          // Email del destinatario
  status: 'success' | 'failed'; // Esito dell'invio
  error: string | null;        // Messaggio errore se fallito
}

// Schema Mongoose per la collection 'emailLogs'
const EmailLogSchema = new Schema<IEmailLog>({
  alertId: { type: String, required: true },
  alertTitle: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  recipient: { type: String, required: true },
  // Valida che lo stato sia solo 'success' o 'failed'
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
  },
  error: { type: String, default: null },  // Null se success
});

// Export sicuro: riutilizza il modello esistente (previene errori HMR)
export const EmailLog = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
