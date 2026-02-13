import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  filename: string;
  mimeType: string;
  filesize: number;
  width?: number;
  height?: number;
  url: string;
  alt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    filesize: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    url: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
