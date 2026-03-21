import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interfaccia per il documento User in MongoDB.
 * Rappresenta un utente Telegram sottoscritto alle notifiche.
 */
export interface IUser extends Document {
  chatId: string;              // ID chat Telegram univoco
  username: string;            // Username Telegram (opzionale)
  subscribed: boolean;         // Flag: utente ha attivato le notifiche
  createdAt: Date;             // Data di registrazione
}

// Schema Mongoose per la collection 'users'
const UserSchema = new Schema<IUser>({
  chatId: { type: String, required: true, unique: true },
  username: { type: String },
  subscribed: { type: Boolean, default: true },  // Default: sottoscritto
  createdAt: { type: Date, default: Date.now },
});

// Export sicuro: riutilizza il modello esistente (previene errori HMR)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
