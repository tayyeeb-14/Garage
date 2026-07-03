import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  name: string;
  description?: string;
  category: string;
  price: number;
  estimatedDuration?: number;
  thumbnailImage?: string;
  galleryImages?: string[];
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    estimatedDuration: {
      type: Number,
      min: [15, 'Duration must be at least 15 minutes'],
      default: 30,
    },
    thumbnailImage: {
      type: String,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>('Service', serviceSchema);
