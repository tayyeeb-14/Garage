import { Admin } from '../models/Admin.js';
import { Customer } from '../models/Customer.js';

export class AuthRepository {
  async findAdminByEmail(email: string) {
    return Admin.findOne({ email }).lean();
  }

  async findCustomerByEmail(email: string) {
    return Customer.findOne({ email }).lean();
  }

  async createAdmin(data: { name: string; email: string; passwordHash: string; role?: string }) {
    return Admin.create(data);
  }

  async createCustomer(data: { fullName: string; email: string; passwordHash: string; phone?: string }) {
    return Customer.create(data);
  }

  async updateCustomer(id: string, data: Record<string, unknown>) {
    return Customer.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async findCustomerById(id: string) {
    return Customer.findById(id).select('-passwordHash').lean();
  }
}
