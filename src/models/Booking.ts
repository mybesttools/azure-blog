import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  name: string;
  email: string;
  from: Date;
  to: Date;
  notes?: string;
  status: 'pending' | 'confirmed' | 'declined';
  lang: 'pl' | 'en' | 'de';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined'],
      default: 'pending',
    },
    lang: {
      type: String,
      enum: ['pl', 'en', 'de'],
      default: 'pl',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
