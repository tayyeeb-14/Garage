import mongoose, { Document, Schema } from 'mongoose';

export interface IGallery extends Document {
  title: string;
  imageUrl: string;
  caption?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gallerySchema = new Schema<IGallery>(
  {
    title: {
      type: String,
      required: [true, 'Gallery title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [250, 'Caption cannot exceed 250 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Gallery = mongoose.model<IGallery>('Gallery', gallerySchema);
