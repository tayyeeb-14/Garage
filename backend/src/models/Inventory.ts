import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  inventoryId: string;
  itemName: string;
  sku: string;
  barcode?: string;
  category: string;
  brand: string;
  compatibleVehicles: string[];
  supplierName: string;
  supplierPhone: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  rackLocation: string;
  image?: string;
  description?: string;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    inventoryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
      maxlength: [150, 'Item name cannot exceed 150 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      unique: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    compatibleVehicles: {
      type: [String],
      default: [],
    },
    supplierName: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    supplierPhone: {
      type: String,
      required: [true, 'Supplier phone is required'],
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    minimumStock: {
      type: Number,
      required: [true, 'Minimum stock is required'],
      min: [0, 'Minimum stock cannot be negative'],
    },
    maximumStock: {
      type: Number,
      required: [true, 'Maximum stock is required'],
      min: [0, 'Maximum stock cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    rackLocation: {
      type: String,
      required: [true, 'Rack location is required'],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out Of Stock'],
      default: 'In Stock',
    },
    deletedAt: {
      type: Date,
      default: null,
      sparse: true,
    },
  },
  { timestamps: true }
);

inventorySchema.index({ itemName: 'text', sku: 'text', category: 'text', brand: 'text' });

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
