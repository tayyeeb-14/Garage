import mongoose, { Document, Schema } from 'mongoose';

export type BannerCtaAction = 'service' | 'parts' | 'external';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: Date;
  endDate?: Date;
  ctaText?: string;
  ctaAction: BannerCtaAction;
  targetId?: string;
  targetUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [300, 'Subtitle cannot exceed 300 characters'],
    },
    imageUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: [0, 'Display order cannot be negative'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    ctaText: {
      type: String,
      trim: true,
      maxlength: [60, 'CTA text cannot exceed 60 characters'],
      default: 'Learn more',
    },
    ctaAction: {
      type: String,
      enum: ['service', 'parts', 'external'],
      default: 'external',
    },
    targetId: {
      type: String,
      trim: true,
    },
    targetUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);
