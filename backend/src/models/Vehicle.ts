import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  customer: mongoose.Types.ObjectId;
  plateNumber: string;
  make: string;
  modelName: string;
  year: number;
  color?: string;
  vin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
    },
    modelName: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: [1900, 'Year must be at least 1900'],
      max: [2100, 'Year cannot exceed 2100'],
    },
    color: {
      type: String,
      trim: true,
      maxlength: [50, 'Color cannot exceed 50 characters'],
    },
    vin: {
      type: String,
      trim: true,
      maxlength: [30, 'VIN cannot exceed 30 characters'],
    },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
