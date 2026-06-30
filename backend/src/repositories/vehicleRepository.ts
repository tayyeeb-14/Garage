import { Vehicle } from '../models/Vehicle.js';

export class VehicleRepository {
  async findAll(query: Record<string, unknown> = {}) {
    const filter: Record<string, unknown> = {};
    if (query.customerId) {
      filter.customer = query.customerId;
    }
    return Vehicle.find(filter).sort({ createdAt: -1 }).lean();
  }
}
