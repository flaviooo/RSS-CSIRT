import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interfaccia per il documento Alert in MongoDB.
 * Rappresenta un advisory di sicurezza CVE.
 */
export interface IAlert extends Document {
  rssId: string;              // ID univoco dal feed RSS (base64 del link)
  title: string;              // Titolo dell'advisory
  link: string;              // URL all'advisory completo
  description: string;        // Descrizione/sommario dell'advisory
  pubDate: Date;              // Data di pubblicazione originale (pubDate RSS)
  updatedAt: Date | null;    // Data di aggiornamento (dc:date RSS)
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown';  // Livello di severità
  cveIds: string[];          // Lista di CVE IDs menzionati nell'advisory
  receivedAt: Date;           // Data di ricezione nel database
  sentViaEmail: boolean;      // Flag: email inviata
  sentViaTelegram: boolean;  // Flag: notifica Telegram inviata
  emailSentAt: Date | null;  // Data invio email
}

// Schema Mongoose per la collection 'alerts'
const AlertSchema = new Schema<IAlert>({
  // ID univoco dal feed RSS - garantisce univocità
  rssId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  link: { type: String, required: true },
  description: { type: String },
  pubDate: { type: Date, required: true },
  // dc:date dal feed RSS - data di aggiornamento dell'advisory
  updatedAt: { type: Date, default: null },
  // Severità estratta da titolo/descrizione
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'unknown'],
    default: 'unknown',
  },
  cveIds: [{ type: String }],      // Array di CVE IDs estratti
  receivedAt: { type: Date, default: Date.now },  // Quando è stato salvato
  sentViaEmail: { type: Boolean, default: false },
  sentViaTelegram: { type: Boolean, default: false },
  emailSentAt: { type: Date, default: null },
});

// Export sicuro: riutilizza il modello esistente se già definito (previene errori HMR)
export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
