import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ServiceFaqItem {
  question: string;
  answer: string;
}

export interface IService extends Document {
  name: string;
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  estimatedDuration?: number;
  thumbnailImage?: string;
  galleryImages?: string[];
  includes?: string[];
  faq?: ServiceFaqItem[];
  compatibleVehicles?: string[];
  relatedServices?: Types.ObjectId[];
  rating?: number;
  isActive: boolean;
  isFeatured: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<ServiceFaqItem>(
  {
    question: { type: String, trim: true, maxlength: 300 },
    answer: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

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
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    fullDescription: {
      type: String,
      trim: true,
      maxlength: [5000, 'Full description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [80, 'Category cannot exceed 80 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      default: 0,
    },
    discountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100'],
      default: 0,
    },
    estimatedDuration: {
      type: Number,
      min: [15, 'Duration must be at least 15 minutes'],
      default: 30,
    },
    thumbnailImage: {
      type: String,
      default: null,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    includes: {
      type: [String],
      default: [],
    },
    faq: {
      type: [faqSchema],
      default: [],
    },
    compatibleVehicles: {
      type: [String],
      default: [],
    },
    relatedServices: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
      default: [],
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      sparse: true,
    },
  },
  { timestamps: true },
);

serviceSchema.index({ name: 'text', description: 'text', category: 'text' });
serviceSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
serviceSchema.index({ deletedAt: 1, category: 1 });

export const Service = mongoose.model<IService>('Service', serviceSchema);
