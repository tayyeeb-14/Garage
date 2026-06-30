import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  customer: mongoose.Types.ObjectId;
  vehicle?: mongoose.Types.ObjectId;
  services: mongoose.Types.ObjectId[];
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    services: [{
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'At least one service is required'],
    }],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
