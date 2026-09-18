import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'user';
  type: 'local' | 'entraId';
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Entra ID users authenticate via SSO and have no local password.
      required: function (this: IUser) {
        return this.type === 'local';
      },
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    type: {
      type: String,
      enum: ['local', 'entraId'],
      default: 'local',
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
