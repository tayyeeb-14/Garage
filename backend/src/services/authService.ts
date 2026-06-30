import bcrypt from 'bcryptjs';
import { AuthRepository } from '../repositories/authRepository.js';
import { buildTokenPayload, signToken, verifyToken } from '../utils/auth.js';

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async adminLogin(email: string, password: string) {
    const admin = await this.authRepository.findAdminByEmail(email);
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = signToken(buildTokenPayload(admin._id, admin.role, 'access'), 'access');
    const refreshToken = signToken(buildTokenPayload(admin._id, admin.role, 'refresh'), 'refresh');

    return {
      user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
      accessToken,
      refreshToken,
    };
  }

  async customerRegister(input: { fullName: string; email: string; password: string; phone?: string }) {
    const existingCustomer = await this.authRepository.findCustomerByEmail(input.email);
    if (existingCustomer) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const customer = await this.authRepository.createCustomer({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      phone: input.phone,
    });

    const accessToken = signToken(buildTokenPayload(customer._id, 'customer', 'access'), 'access');
    const refreshToken = signToken(buildTokenPayload(customer._id, 'customer', 'refresh'), 'refresh');

    return {
      user: { id: customer._id, fullName: customer.fullName, email: customer.email, role: 'customer' },
      accessToken,
      refreshToken,
    };
  }

  async customerLogin(email: string, password: string) {
    const customer = await this.authRepository.findCustomerByEmail(email);
    if (!customer) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = signToken(buildTokenPayload(customer._id, 'customer', 'access'), 'access');
    const refreshToken = signToken(buildTokenPayload(customer._id, 'customer', 'refresh'), 'refresh');

    return {
      user: { id: customer._id, fullName: customer.fullName, email: customer.email, role: 'customer' },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    const payload = verifyToken(token);
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const accessToken = signToken({ sub: payload.sub, role: payload.role, type: 'access' }, 'access');
    return { accessToken };
  }

  async getProfile(userId: string, role: string) {
    if (role === 'customer') {
      return this.authRepository.findCustomerById(userId);
    }

    const admin = await this.authRepository.findAdminByEmail('');
    return admin;
  }

  async updateProfile(userId: string, role: string, data: Record<string, unknown>) {
    if (role === 'customer') {
      return this.authRepository.updateCustomer(userId, data);
    }

    return { id: userId, role };
  }
}
