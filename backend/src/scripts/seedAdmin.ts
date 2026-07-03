import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@menterprises.com';
const ADMIN_PASSWORD = 'Admin@12345';
const ADMIN_NAME = 'Admin';

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

    console.log('\n✅ Seed completed successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

void seedAdmin();
