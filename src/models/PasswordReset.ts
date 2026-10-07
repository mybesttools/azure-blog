import mongoose, { Schema, Document } from 'mongoose';

// A pending password reset for an Entra ID account. Kept separate from User,
// since an Entra ID account only gets a User document on its first sign-in
// here, and the account that needs a reset may never have signed in.
export interface IPasswordReset extends Document {
  // Only a SHA-256 hash of the emailed token is stored, so a database leak
  // can't be turned into working reset links.
  tokenHash: string;
  entraUserId: string;
  userPrincipalName: string;
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    tokenHash: { type: String, required: true, unique: true },
    entraUserId: { type: String, required: true },
    userPrincipalName: { type: String, required: true, index: true },
    // MongoDB deletes the document once this time has passed.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.PasswordReset ||
  mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);
