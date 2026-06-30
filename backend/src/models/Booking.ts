import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  customer: mongoose.Types.ObjectId;
  vehicle?: mongoose.Types.ObjectId;
  services: mongoose.Types.ObjectId[];
  bookingDate: Date;
  preferredTime: string;
  pickupRequired: boolean;
  address: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    preferredTime: {
      type: String,
      required: [true, 'Preferred time is required'],
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Preferred time must be in HH:MM format'],
    },
    pickupRequired: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
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
