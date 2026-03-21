import mongoose, { Schema, Document } from 'mongoose';

export type PendingAlertStatus = 'pending' | 'approved' | 'outofftopic' | 'sent';

export interface IPendingAlert extends Document {
  rssId: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  updatedAt: Date | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  cveIds: string[];
  status: PendingAlertStatus;
  receivedAt: Date;
  evaluatedAt: Date | null;
  evaluatedBy: string | null;
  sentViaEmail: boolean;
  emailSentAt: Date | null;
}

const PendingAlertSchema = new Schema<IPendingAlert>({
  rssId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  link: { type: String, required: true },
  description: { type: String },
  pubDate: { type: Date, required: true },
  updatedAt: { type: Date, default: null },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'unknown'],
    default: 'unknown',
  },
  cveIds: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'outofftopic', 'sent'],
    default: 'pending',
  },
  receivedAt: { type: Date, default: Date.now },
  evaluatedAt: { type: Date, default: null },
  evaluatedBy: { type: String, default: null },
  sentViaEmail: { type: Boolean, default: false },
  emailSentAt: { type: Date, default: null },
});

export const PendingAlert = mongoose.models.PendingAlert || mongoose.model<IPendingAlert>('PendingAlert', PendingAlertSchema);
