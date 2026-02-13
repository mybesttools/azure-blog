import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  excerpt: string;
  content: any; // Can be markdown string or Lexical JSON
  coverImage?: string; // Can be ObjectId ref or direct path string
  date: Date;
  author: {
    name: string;
    picture?: string; // Can be ObjectId ref or direct path string
  };
  slug: string;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    coverImage: {
      type: Schema.Types.Mixed, // Can be ObjectId or string
    },
    date: {
      type: Date,
      required: true,
    },
    author: {
      name: {
        type: String,
        required: true,
      },
      picture: {
        type: Schema.Types.Mixed, // Can be ObjectId or string
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
