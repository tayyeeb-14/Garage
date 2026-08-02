import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { Service } from '../models/Service.js';
import Inventory from '../models/Inventory.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@menterprises.com';
const ADMIN_PASSWORD = 'Admin@12345';
const ADMIN_NAME = 'Admin';

const defaultServices = [
  {
    name: 'Full Bike Service',
    category: 'Full Service',
    price: 799,
    originalPrice: 999,
    discountPercent: 20,
    estimatedDuration: 90,
    shortDescription: 'Complete tune-up, lubrication, and inspection for your bike.',
    isFeatured: true,
    rating: 4.8,
  },
  {
    name: 'Engine Oil Change',
    category: 'Oil Change',
    price: 499,
    originalPrice: 649,
    discountPercent: 23,
    estimatedDuration: 45,
    shortDescription: 'Premium oil replacement with filter check and top-up.',
    isFeatured: true,
    rating: 4.7,
  },
  {
    name: 'Brake Service',
    category: 'Brake Service',
    price: 650,
    originalPrice: 799,
    discountPercent: 18,
    estimatedDuration: 60,
    shortDescription: 'Brake pad inspection, adjustment, and safety check.',
    rating: 4.6,
  },
  {
    name: 'Chain Cleaning & Lubrication',
    category: 'Washing',
    price: 299,
    originalPrice: 349,
    discountPercent: 14,
    estimatedDuration: 35,
    shortDescription: 'Chain deep clean, degrease, and premium lubrication.',
    rating: 4.5,
  },
  {
    name: 'Battery Replacement',
    category: 'Battery',
    price: 1299,
    originalPrice: 1499,
    discountPercent: 13,
    estimatedDuration: 40,
    shortDescription: 'Replace your battery and verify electrical health.',
    isFeatured: true,
    rating: 4.7,
  },
  {
    name: 'Clutch Adjustment',
    category: 'Engine Repair',
    price: 549,
    originalPrice: 699,
    discountPercent: 21,
    estimatedDuration: 50,
    shortDescription: 'Adjust clutch settings for smoother shifting and response.',
    rating: 4.4,
  },
  {
    name: 'Air Filter Cleaning',
    category: 'AC Service',
    price: 249,
    originalPrice: 299,
    discountPercent: 17,
    estimatedDuration: 25,
    shortDescription: 'Clean or replace your air filter for peak performance.',
    rating: 4.6,
  },
  {
    name: 'Wheel Alignment',
    category: 'Tyres',
    price: 699,
    originalPrice: 849,
    discountPercent: 18,
    estimatedDuration: 55,
    shortDescription: 'Professional alignment for stable handling and safety.',
    rating: 4.8,
  },
  {
    name: 'Tyre Replacement',
    category: 'Tyres',
    price: 1699,
    originalPrice: 1999,
    discountPercent: 15,
    estimatedDuration: 80,
    shortDescription: 'Replace front or rear tyres with quality alternatives.',
    rating: 4.5,
  },
  {
    name: 'Engine Diagnosis',
    category: 'Engine Repair',
    price: 899,
    originalPrice: 1049,
    discountPercent: 14,
    estimatedDuration: 70,
    shortDescription: 'Comprehensive engine health check with diagnostic tools.',
    rating: 4.6,
  },
  {
    name: 'Wash & Polish',
    category: 'Washing',
    price: 349,
    originalPrice: 449,
    discountPercent: 22,
    estimatedDuration: 35,
    shortDescription: 'Exterior wash and polish for a showroom finish.',
    rating: 4.9,
  },
  {
    name: 'General Inspection',
    category: 'Full Service',
    price: 399,
    originalPrice: 499,
    discountPercent: 20,
    estimatedDuration: 40,
    shortDescription: 'Full bike inspection covering brakes, engine, and chassis.',
    rating: 4.7,
  },
];

const defaultInventoryItems = [
  {
    inventoryId: 'PART-001',
    itemName: 'Engine Oil 10W30',
    sku: 'EO-10W30',
    category: 'Oil',
    brand: 'PremiumX',
    compatibleVehicles: [],
    purchasePrice: 320,
    sellingPrice: 499,
    originalPrice: 649,
    discountPercent: 23,
    quantity: 24,
    minimumStock: 5,
    maximumStock: 100,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: true,
  },
  {
    inventoryId: 'PART-002',
    itemName: 'Engine Oil 20W40',
    sku: 'EO-20W40',
    category: 'Oil',
    brand: 'RoadPro',
    compatibleVehicles: [],
    purchasePrice: 380,
    sellingPrice: 549,
    originalPrice: 749,
    discountPercent: 26,
    quantity: 18,
    minimumStock: 5,
    maximumStock: 100,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: true,
  },
  {
    inventoryId: 'PART-003',
    itemName: 'Oil Filter',
    sku: 'OF-001',
    category: 'Filter',
    brand: 'FilterMax',
    compatibleVehicles: [],
    purchasePrice: 120,
    sellingPrice: 199,
    originalPrice: 249,
    discountPercent: 20,
    quantity: 36,
    minimumStock: 8,
    maximumStock: 120,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-004',
    itemName: 'Air Filter',
    sku: 'AF-001',
    category: 'Filter',
    brand: 'CleanAir',
    compatibleVehicles: [],
    purchasePrice: 210,
    sellingPrice: 299,
    originalPrice: 349,
    discountPercent: 14,
    quantity: 20,
    minimumStock: 5,
    maximumStock: 80,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-005',
    itemName: 'Brake Pads Front',
    sku: 'BP-FR',
    category: 'Brake',
    brand: 'SafeStop',
    compatibleVehicles: [],
    purchasePrice: 680,
    sellingPrice: 899,
    originalPrice: 1099,
    discountPercent: 18,
    quantity: 12,
    minimumStock: 6,
    maximumStock: 60,
    unit: 'sets',
    status: 'Low Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-006',
    itemName: 'Brake Pads Rear',
    sku: 'BP-RR',
    category: 'Brake',
    brand: 'SafeStop',
    compatibleVehicles: [],
    purchasePrice: 720,
    sellingPrice: 949,
    originalPrice: 1199,
    discountPercent: 21,
    quantity: 10,
    minimumStock: 6,
    maximumStock: 60,
    unit: 'sets',
    status: 'Low Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-007',
    itemName: 'Clutch Plate',
    sku: 'CL-001',
    category: 'Transmission',
    brand: 'GripTech',
    compatibleVehicles: [],
    purchasePrice: 1290,
    sellingPrice: 1799,
    originalPrice: 2199,
    discountPercent: 18,
    quantity: 9,
    minimumStock: 4,
    maximumStock: 40,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-008',
    itemName: 'Spark Plug',
    sku: 'SP-001',
    category: 'Ignition',
    brand: 'SparkPro',
    compatibleVehicles: [],
    purchasePrice: 80,
    sellingPrice: 119,
    originalPrice: 149,
    discountPercent: 20,
    quantity: 54,
    minimumStock: 10,
    maximumStock: 120,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-009',
    itemName: 'Bosch Battery',
    sku: 'BB-001',
    category: 'Battery',
    brand: 'Bosch',
    compatibleVehicles: [],
    purchasePrice: 2450,
    sellingPrice: 3199,
    originalPrice: 3699,
    discountPercent: 14,
    quantity: 6,
    minimumStock: 3,
    maximumStock: 25,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: true,
  },
  {
    inventoryId: 'PART-010',
    itemName: 'Headlight Bulb',
    sku: 'HB-001',
    category: 'Lighting',
    brand: 'BrightLite',
    compatibleVehicles: [],
    purchasePrice: 160,
    sellingPrice: 249,
    originalPrice: 299,
    discountPercent: 16,
    quantity: 20,
    minimumStock: 8,
    maximumStock: 80,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-011',
    itemName: 'Indicator Set',
    sku: 'IS-001',
    category: 'Lighting',
    brand: 'SignalPro',
    compatibleVehicles: [],
    purchasePrice: 420,
    sellingPrice: 599,
    originalPrice: 749,
    discountPercent: 20,
    quantity: 16,
    minimumStock: 8,
    maximumStock: 80,
    unit: 'sets',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-012',
    itemName: 'Chain Sprocket Kit',
    sku: 'CSK-001',
    category: 'Drive',
    brand: 'RoadTread',
    compatibleVehicles: [],
    purchasePrice: 1150,
    sellingPrice: 1499,
    originalPrice: 1799,
    discountPercent: 17,
    quantity: 12,
    minimumStock: 4,
    maximumStock: 40,
    unit: 'kits',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-013',
    itemName: 'Front Disc Plate',
    sku: 'FDP-001',
    category: 'Brake',
    brand: 'StopSure',
    compatibleVehicles: [],
    purchasePrice: 980,
    sellingPrice: 1299,
    originalPrice: 1499,
    discountPercent: 13,
    quantity: 8,
    minimumStock: 3,
    maximumStock: 30,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: false,
  },
  {
    inventoryId: 'PART-014',
    itemName: 'Rear Tyre',
    sku: 'RT-001',
    category: 'Tyre',
    brand: 'GripRide',
    compatibleVehicles: [],
    purchasePrice: 1650,
    sellingPrice: 2199,
    originalPrice: 2499,
    discountPercent: 12,
    quantity: 11,
    minimumStock: 4,
    maximumStock: 50,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: true,
  },
  {
    inventoryId: 'PART-015',
    itemName: 'Front Tyre',
    sku: 'FT-001',
    category: 'Tyre',
    brand: 'GripRide',
    compatibleVehicles: [],
    purchasePrice: 1590,
    sellingPrice: 2099,
    originalPrice: 2399,
    discountPercent: 13,
    quantity: 13,
    minimumStock: 5,
    maximumStock: 50,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: true,
  },
  {
    inventoryId: 'PART-016',
    itemName: 'Yamaha R7 2025',
    sku: 'NB-001',
    category: 'New Vehicles',
    brand: 'Yamaha',
    compatibleVehicles: [],
    purchasePrice: 800000,
    sellingPrice: 895000,
    originalPrice: 950000,
    discountPercent: 6,
    quantity: 1,
    minimumStock: 1,
    maximumStock: 1,
    unit: 'unit',
    status: 'In Stock',
    isFeatured: true,
    isTrending: true,
    fuelType: 'Petrol',
    transmission: 'Manual',
    kmDriven: 0,
    ownerCount: 0,
    location: 'Mumbai',
    sellerContact: '+919999000111',
    verifiedSeller: true,
    warranty: '3-year manufacturer warranty',
    specifications: 'Engine: 689cc parallel-twin\nPower: 72 HP\nSeat height: 830 mm\nFuel tank: 13 L',
    shortDescription: 'Premium new sport bike with advanced handling and electronics.',
    fullDescription: 'The Yamaha R7 brings thrilling performance with a comfortable chassis, premium braking, and refined styling. Ideal for riders seeking a high-end modern sport bike.',
  },
  {
    inventoryId: 'PART-017',
    itemName: 'Royal Enfield Classic 350 2021',
    sku: 'UB-001',
    category: 'Used Vehicles',
    brand: 'Royal Enfield',
    compatibleVehicles: [],
    purchasePrice: 150000,
    sellingPrice: 185000,
    originalPrice: 199999,
    discountPercent: 7,
    quantity: 1,
    minimumStock: 1,
    maximumStock: 1,
    unit: 'unit',
    status: 'In Stock',
    isFeatured: false,
    isTrending: true,
    fuelType: 'Petrol',
    transmission: 'Manual',
    kmDriven: 8600,
    ownerCount: 1,
    location: 'Pune',
    sellerContact: '+919999000222',
    verifiedSeller: true,
    warranty: '6-month certified resale warranty',
    specifications: 'Engine: 349cc single-cylinder\nPower: 20.2 HP\nMileage: 35 kmpl\nBrake: Disc front, drum rear',
    shortDescription: 'Well-maintained classic cruiser with low mileage and recent service history.',
    fullDescription: 'This Classic 350 delivers timeless style, reliable touring comfort, and a strong ownership record. It is perfect for city commuting and long weekend rides.',
  },
  {
    inventoryId: 'PART-018',
    itemName: 'Toyota Camry 2025',
    sku: 'NC-001',
    category: 'New Vehicles',
    brand: 'Toyota',
    compatibleVehicles: [],
    purchasePrice: 2900000,
    sellingPrice: 3299000,
    originalPrice: 3499000,
    discountPercent: 5,
    quantity: 1,
    minimumStock: 1,
    maximumStock: 1,
    unit: 'unit',
    status: 'In Stock',
    isFeatured: true,
    isTrending: false,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    kmDriven: 0,
    ownerCount: 0,
    location: 'Delhi',
    sellerContact: '+919999000333',
    verifiedSeller: true,
    warranty: '5-year manufacturer warranty',
    specifications: 'Engine: 2.5L hybrid\nTransmission: CVT\nSeating: 5 passengers\nFuel economy: 19 kmpl',
    shortDescription: 'Luxury sedan with hybrid efficiency and advanced safety technology.',
    fullDescription: 'The 2025 Toyota Camry combines comfort, premium interior features, and excellent fuel economy. Ideal for family buyers who want refined reliability.',
  },
  {
    inventoryId: 'PART-019',
    itemName: 'Honda City 2019',
    sku: 'UC-001',
    category: 'Used Vehicles',
    brand: 'Honda',
    compatibleVehicles: [],
    purchasePrice: 720000,
    sellingPrice: 845000,
    originalPrice: 925000,
    discountPercent: 8,
    quantity: 1,
    minimumStock: 1,
    maximumStock: 1,
    unit: 'unit',
    status: 'In Stock',
    isFeatured: false,
    isTrending: true,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    kmDriven: 32000,
    ownerCount: 2,
    location: 'Bengaluru',
    sellerContact: '+919999000444',
    verifiedSeller: true,
    warranty: 'Certified pre-owned warranty available',
    specifications: 'Engine: 1.5L i-VTEC\nTransmission: CVT\nBoot space: 506 L\nFuel economy: 18 kmpl',
    shortDescription: 'Comfortable sedan with good mileage and a polished service record.',
    fullDescription: 'A reliable family car with smooth ride quality, spacious cabin, and a strong ownership background. Great for daily commute and weekend travel.',
  },
  {
    inventoryId: 'PART-020',
    itemName: 'RoadGuard Rider Jacket',
    sku: 'AC-001',
    category: 'Accessories',
    brand: 'RoadGuard',
    compatibleVehicles: [],
    purchasePrice: 2499,
    sellingPrice: 3899,
    originalPrice: 4499,
    discountPercent: 13,
    quantity: 16,
    minimumStock: 4,
    maximumStock: 80,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: true,
    isTrending: false,
    location: 'Chennai',
    sellerContact: '+919999000555',
    verifiedSeller: true,
    warranty: '1-year material warranty',
    specifications: 'Material: Abrasion-resistant textile\nProtection: CE-certified armor\nSize range: S-XXL',
    shortDescription: 'High-visibility riding jacket with breathable mesh panels.',
    fullDescription: 'Engineered for safety and comfort, this rider jacket offers premium armor, weather protection, and a modern fit for long rides.',
    offerDetails: 'Free pair of riding gloves with purchase',
  },
  {
    inventoryId: 'PART-021',
    itemName: 'SafeHead Full-Face Helmet',
    sku: 'RG-001',
    category: 'Riding Gear',
    brand: 'SafeHead',
    compatibleVehicles: [],
    purchasePrice: 1699,
    sellingPrice: 2499,
    originalPrice: 2999,
    discountPercent: 17,
    quantity: 22,
    minimumStock: 5,
    maximumStock: 120,
    unit: 'pcs',
    status: 'In Stock',
    isFeatured: true,
    isTrending: true,
    location: 'Hyderabad',
    sellerContact: '+919999000666',
    verifiedSeller: true,
    warranty: '2-year helmet warranty',
    specifications: 'Certification: ISI & DOT\nShell: Polycarbonate\nVisor: Anti-scratch',
    shortDescription: 'Premium aerodynamic helmet with comfort liner and ventilation.',
    fullDescription: 'This helmet is designed for performance riding with advanced safety features, superior fit, and a clear anti-fog face shield.',
  },
  {
    inventoryId: 'PART-022',
    itemName: 'Socket Wrench Kit',
    sku: 'TL-001',
    category: 'Tools',
    brand: 'FixPro',
    compatibleVehicles: [],
    purchasePrice: 1399,
    sellingPrice: 1999,
    originalPrice: 2499,
    discountPercent: 20,
    quantity: 35,
    minimumStock: 8,
    maximumStock: 100,
    unit: 'sets',
    status: 'In Stock',
    isFeatured: false,
    isTrending: false,
    location: 'Ahmedabad',
    sellerContact: '+919999000777',
    verifiedSeller: true,
    warranty: '6-month satisfaction guarantee',
    specifications: 'Pieces: 42\nMaterial: Chrome vanadium steel\nStorage: Hard case',
    shortDescription: 'Professional mechanic socket set for workshop and home repair.',
    fullDescription: 'Durable, corrosion-resistant socket set with a wide range of sizes and compact carry case for reliable tool storage.',
  },
];

const seedServices = async () => {
  console.log('🔧 Seeding default services...');
  for (const service of defaultServices) {
    const existing = await Service.findOne({ name: service.name }).lean();
    if (existing) {
      console.log(`  - Service already exists: ${service.name}`);
      continue;
    }
    await Service.create({ ...service, isActive: true });
    console.log(`  - Created service: ${service.name}`);
  }
};

const seedInventory = async () => {
  console.log('🔩 Seeding default spare parts...');
  for (const part of defaultInventoryItems) {
    const existing = await Inventory.findOne({ sku: part.sku }).lean();
    if (existing) {
      console.log(`  - Part already exists: ${part.sku}`);
      continue;
    }
    await Inventory.create({ ...part, isActive: true });
    console.log(`  - Created part: ${part.itemName}`);
  }
};

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`🔍 Checking if admin account exists: ${ADMIN_EMAIL}`);
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      // Ensure existing admin has correct name and role
      let updated = false;
      const updates: Record<string, any> = {};
      if (existingAdmin.name !== ADMIN_NAME) {
        updates.name = ADMIN_NAME;
        updated = true;
      }
      if (existingAdmin.role !== 'admin') {
        updates.role = 'admin';
        updated = true;
      }
      if (updated) {
        console.log('🔁 Updating existing admin to conform to single-admin rules...');
        await Admin.findByIdAndUpdate(existingAdmin._id, updates, { new: true });
        const refreshed = await Admin.findById(existingAdmin._id);
        console.log(`\n📋 Admin Details (updated):`);
        console.log(`   Email: ${refreshed?.email}`);
        console.log(`   Name: ${refreshed?.name}`);
        console.log(`   Role: ${refreshed?.role}`);
        console.log(`   Status: ${refreshed?.status}`);
      } else {
        console.log(`\n📋 Admin Details:`);
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Name: ${existingAdmin.name}`);
        console.log(`   Role: ${existingAdmin.role}`);
        console.log(`   Status: ${existingAdmin.status}`);
      }
    } else {
      console.log('🔐 Creating default admin account...');
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const admin = await Admin.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
        status: 'active',
      });

      console.log('\n✅ Admin account created successfully!');
      console.log(`\n📋 Admin Details:`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.status}`);
    }

    console.log(`\n🔐 Login Credentials:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);

    await seedServices();
    await seedInventory();

    console.log('\n✅ Seed completed successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

void seedAdmin();
