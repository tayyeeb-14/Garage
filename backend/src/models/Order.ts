import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  booking?: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  vehicle?: mongoose.Types.ObjectId;
  services: mongoose.Types.ObjectId[];
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'confirmed' | 'in_service' | 'ready_for_pickup' | 'completed' | 'cancelled';
  notes?: string;
  deletedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
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
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'in_service', 'ready_for_pickup', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
