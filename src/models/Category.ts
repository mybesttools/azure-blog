import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  order: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default category
CategorySchema.pre('save', async function() {
  if (this.isDefault) {
    await mongoose.model('Category').updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
