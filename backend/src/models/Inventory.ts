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
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  weight?: number;
  rackLocation: string;
  image?: string;
  galleryImages?: string[];
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  isActive: boolean;
  isFeatured: boolean;
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
      trim: true,
      default: '',
    },
    compatibleVehicles: {
      type: [String],
      default: [],
    },
    supplierName: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    supplierPhone: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
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
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    minimumStock: {
      type: Number,
      min: [0, 'Minimum stock cannot be negative'],
      default: 5,
    },
    maximumStock: {
      type: Number,
      min: [0, 'Maximum stock cannot be negative'],
      default: 100,
    },
    unit: {
      type: String,
      trim: true,
      default: 'piece',
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    rackLocation: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    image: {
      type: String,
      default: null,
    },
    galleryImages: {
      type: [String],
      default: [],
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
  { timestamps: true }
);

inventorySchema.index({ itemName: 'text', sku: 'text', category: 'text', brand: 'text' });

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
